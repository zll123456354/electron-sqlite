const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const packageJson = require(path.join(rootDir, 'package.json'));
const outputPath = path.join(rootDir, 'src', 'generated', 'update-notes.json');
const currentTag = `v${packageJson.version}`;

function runGit(args) {
  return execFileSync('git', [
    '-c',
    'core.quotepath=false',
    '-c',
    'i18n.logOutputEncoding=UTF-8',
    ...args,
  ], {
    cwd: rootDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      LANG: 'C.UTF-8',
      LC_ALL: 'C.UTF-8',
    },
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function tryGit(args) {
  try {
    return runGit(args);
  } catch {
    return '';
  }
}

function getTags() {
  const output = tryGit(['tag', '--sort=v:refname']);
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

function resolveRef(ref) {
  return tryGit(['rev-parse', `${ref}^{}`]);
}

function getRange(tags) {
  const head = resolveRef('HEAD');
  const currentTagIndex = tags.indexOf(currentTag);

  if (currentTagIndex >= 0) {
    return {
      from: tags[currentTagIndex - 1] || null,
      to: currentTag,
      targetRef: `${currentTag}^{}`,
      targetCommit: resolveRef(currentTag),
      head,
    };
  }

  return {
    from: tags[tags.length - 1] || null,
    to: 'HEAD',
    targetRef: 'HEAD',
    targetCommit: head,
    head,
  };
}

function isUserFacingCommit(subject) {
  const text = subject.trim();
  if (!text) return false;
  if (/^merge\b/i.test(text)) return false;
  if (/^v?\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(text)) return false;
  if (/^(chore|build|ci|release)(\(.+\))?:/i.test(text)) return false;
  return true;
}

function toUserFacingText(subject) {
  return subject
    .trim()
    .replace(/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^)]+\))?!?\s*[:：]\s*/i, '')
    .trim();
}

function getCommitItems(range) {
  const prettyFormat = '%s';
  const gitRange = range.from ? `${range.from}..${range.targetRef}` : range.targetRef;
  const output = tryGit(['log', gitRange, `--pretty=format:${prettyFormat}`]);
  const subjects = output ? output.split(/\r?\n/).map((item) => item.trim()) : [];
  const items = subjects.filter(isUserFacingCommit).map(toUserFacingText).filter(Boolean);

  return items.length > 0 ? items : subjects.map(toUserFacingText).filter(Boolean);
}

const tags = getTags();
const range = getRange(tags);
const items = getCommitItems(range);

const updateNotes = {
  version: packageJson.version,
  from: range.from,
  to: range.to,
  generatedAt: new Date().toISOString(),
  items,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(updateNotes, null, 2)}\n`, 'utf8');

console.log(`Generated ${path.relative(rootDir, outputPath)}`);
console.log(`Range: ${range.from || 'initial'}..${range.to}`);
console.log(`Items: ${items.length}`);

const fs = require('fs');
const path = require('path');

// Leer el mensaje del commit actual
const commitMsgPath = path.join('.git', 'COMMIT_EDITMSG');
if (!fs.existsSync(commitMsgPath)) {
  console.log('No commit message found, skipping version update.');
  process.exit(0);
}

const commitMsg = fs.readFileSync(commitMsgPath, 'utf8').trim();
console.log('Commit message:', commitMsg);

// Determinar tipo de cambio de versión
let bump = null;
if (/^feat(\([^)]*\))?:/.test(commitMsg)) {
  bump = 'minor';
} else if (/^fix(\([^)]*\))?:/.test(commitMsg)) {
  bump = 'patch';
} else if (commitMsg.includes('BREAKING CHANGE')) {
  bump = 'major';
} else {
  console.log('Not a conventional commit that triggers release, skipping version update.');
  process.exit(0);
}

// Leer package.json
const packageJsonPath = path.join('.', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;
const parts = version.split('.').map(Number);

// Actualizar versión
if (bump === 'major') {
  parts[0] += 1;
  parts[1] = 0;
  parts[2] = 0;
} else if (bump === 'minor') {
  parts[1] += 1;
  parts[2] = 0;
} else {
  parts[2] += 1;
}

const newVersion = parts.join('.');
packageJson.version = newVersion;

// Escribir package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`Version bumped from ${version} to ${newVersion}`);

// Hacer stage del package.json modificado
const { execSync } = require('child_process');
try {
  execSync('git add package.json', { stdio: 'inherit' });
} catch (e) {
  console.error('Failed to stage package.json');
}

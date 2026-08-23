const fs = require('fs');

const logPath = 'C:\\Users\\GI\\.gemini\\antigravity-ide\\brain\\f0022a21-f08d-4c46-942a-39156e71f7bd\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.error("Log file does not exist.");
  process.exit(1);
}

const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

const lineObj = JSON.parse(lines[47]);
console.log("MATCHED STEP CONTENT:");
console.log(lineObj.content);

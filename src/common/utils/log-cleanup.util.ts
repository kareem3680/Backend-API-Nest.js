import * as fs from 'fs';
import * as path from 'path';

export const cleanOldLogs = (logDir: string): void => {
  const now = Date.now();
  const maxAge = 30 * 24 * 60 * 60 * 1000;

  if (!fs.existsSync(logDir)) {
    return;
  }

  const files = fs.readdirSync(logDir);

  for (const file of files) {
    const filePath = path.join(logDir, file);
    const stats = fs.statSync(filePath);

    if (!stats.isFile()) {
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(Boolean);

    const recentLines = lines.filter((line) => {
      const match = line.match(
        /^(\d{1,2}\/\d{1,2}\/\d{4},\s*\d{1,2}:\d{2}:\d{2}\s*[AP]M)/,
      );
      if (!match) {
        return true;
      }
      const logTime = new Date(match[1]).getTime();
      return now - logTime < maxAge;
    });

    fs.writeFileSync(filePath, recentLines.join('\n') + '\n', 'utf-8');
  }
};

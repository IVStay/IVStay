import readline from 'node:readline';

/**
 * Asks a question in the terminal without showing what is typed (for passwords).
 * Works with typing and pasting; Backspace deletes, Ctrl-C cancels.
 * When input isn't a terminal (e.g. piped), it reads one line instead.
 */
export function askHidden(question) {
  const stdin = process.stdin;
  process.stdout.write(question);

  if (!stdin.isTTY) {
    const rl = readline.createInterface({ input: stdin });
    return new Promise((resolve) => {
      rl.once('line', (line) => {
        resolve(line); // settle first: rl.close() fires 'close' synchronously
        rl.close();
        process.stdout.write('\n');
      });
      rl.once('close', () => resolve(''));
    });
  }

  return new Promise((resolve) => {
    let value = '';
    const finish = (result) => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      process.stdout.write('\n');
      resolve(result);
    };
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') return finish(value);
        if (ch === '\u0003') {
          finish('');
          process.exit(130);
        }
        if (ch === '\u007f' || ch === '\b') {
          value = value.slice(0, -1);
          continue;
        }
        if (ch >= ' ') value += ch;
      }
    };
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    stdin.resume();
    stdin.on('data', onData);
  });
}

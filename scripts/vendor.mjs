import { mkdir, rm, copyFile } from 'node:fs/promises';
for (const directory of ['vendor/bootstrap', 'vendor/jquery']) {
  await rm(directory, { recursive: true, force: true });
}
for (const file of ['css/bootstrap.min.css', 'css/bootstrap.min.css.map', 'js/bootstrap.bundle.min.js', 'js/bootstrap.bundle.min.js.map']) {
  await mkdir(`vendor/bootstrap/${file.split('/')[0]}`, { recursive: true });
  await copyFile(`node_modules/bootstrap/dist/${file}`, `vendor/bootstrap/${file}`);
}
await copyFile('node_modules/bootstrap/LICENSE', 'vendor/bootstrap/LICENSE');

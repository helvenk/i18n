import { IApi } from 'father';
import fs from 'fs';
import path from 'path';

export default (api: IApi) => {
  api.addRegularCheckup(() => {
    const files = ['babel', 'eslint'];

    for (const file of files) {
      const filePath = path.join(api.cwd, `dist/cjs/${file}/index.js`);
      if (fs.existsSync(filePath)) {
        api.logger.event(`Copy ${file}.js to root`);
        fs.copyFileSync(filePath, path.join(api.cwd, file + '.js'));
      }
    }
  });
};

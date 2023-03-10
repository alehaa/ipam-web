/* This file is part of IPAM Web.
 *
 * Copyright (c) Alexander Haase <ahaase@alexhaase.de>
 *
 * This project is licensed under the MIT License. For the full copyright and
 * license information, please view the LICENSE file that was distributed with
 * this source code.
 */

const path = require('path');
const webpack = require('webpack');


module.exports = (env) => { return {
  entry: {
    main: path.join(__dirname, '_webpack', 'main.js'),
  },
  output: {
    /* Output files will be put into jekyll's asset directory. Putting these
     * into the final destination path will be handled by jekyll afterwards. */
    path: path.resolve(__dirname, 'assets'),
    filename: '[name].js',

    /* Use 'window' as default library target, so all exported functions will be
     * available in HTML. */
    libraryTarget: 'window',
  },

  plugins: [
    /* Define variables, that will be substituted in code. This is required e.g.
     * for defining a dynamic base URL on build-time. */
    new webpack.DefinePlugin({
      IPAM_BASE_URL: JSON.stringify(env.IPAM_BASE_URL ?? ''),
    }),
  ],

  /* Always use 'production' as build mode, so the application can be tested
   * with the final optimized code. */
  mode: 'production',
}};

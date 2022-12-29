/* This file is part of IPAM Web.
 *
 * Copyright (c) Alexander Haase <ahaase@alexhaase.de>
 *
 * This project is licensed under the MIT License. For the full copyright and
 * license information, please view the LICENSE file that was distributed with
 * this source code.
 */

const path = require('path');


module.exports = {
  entry: {
    main: path.join(__dirname, '_webpack', 'main.js'),
  },
  output: {
    /* Output files will be put directly into jekyll's destination path. This is
     * useful for development, to not trigger a costly jekyll rebuild on
     * JavaScript changes. */
    path: path.resolve(__dirname, '_site', 'assets'),
    filename: '[name].js',

    /* Use 'window' as default library target, so all exported functions will be
     * available in HTML. */
    libraryTarget: 'window',
  },

  /* Always use 'production' as build mode, so the application can be tested
   * with the final optimized code. */
  mode: 'production',
};

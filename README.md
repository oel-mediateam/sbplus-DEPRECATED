#Storybook Plus (SB+)
**_version 2.8.0-BPS_**

---
###Setup Information
Storybook Plus (SB+) is built with jQuery, CSS, HTML5, and VideoJS. The whole project is managed with the use of [CodeKit](https://incident57.com/codekit/) to validate and minify scripts and using [SASS](http://sass-lang.com/) for CSS.

**Getting the Source Files**

1. Download the source files from the [BPS branch of the sbplus repository](https://github.com/oel-mediateam/sbplus/tree/bps).
  * The download button is green and labeled with "Clone or download" on the right side of the web page.
  * This version of SB+ (2.8.0-BPS) is a derivative of the actual 2.8.0 version for the purpose of transitioning BPS contents away from the CEOEL Media web server.
2. Upload everything in the `sources` folder to the web host. It is recommended to create a directory named `sbplus` in the web host and upload the source files into that directory.
3. Inside the `example` folder, an example of the file structure is presented for a SB+ presentation project. See the [SB+ Documentation](https://media.uwex.edu/resources/documentation/storybook-plus-v2/) for details on setting up a SB+ presentation project.
  * Do not upload this folder to the web host.

**Editing the `index.html` file**

Since this version derive from the actual 2.8.0 version, the `index.html` file requires additional editing before use.

1. Open the `index.html` file with a text editor.
2. On line 7 to 13, change the URL in the `href` and `src` attributes respectively to the source files on your web host.  
For example, change `../sources/css/storybookplus.css` to `[your_web_host_url]/sbplus/css/storybookplus.css`, where `[your_web_host_url]` is the domain name of your web host.
3. On line 27, change the value of the `data-root` attribute to the URL of the sbplus directory on your web host. It will defaulted to `../sources/` if left empty.
4. Replace the exisiting `index.html` file in SB+ presenations with the edited `index.html` file.

---
###Documentation
For more details and how to setup a SB+ presentation, please visit the [SB+ Documentation](https://media.uwex.edu/resources/documentation/storybook-plus-v2/).

---
###System Requirements
For details on system requirements, please see the [SYSTEMREQ.md file](https://github.com/oel-mediateam/sbplus/blob/bps/SYSTEMREQ.md).

---
###Bug Reporting and Questions
If any bugs/glitches are found in the SB+, please report them under the "**[Issues](https://github.com/oel-mediateam/sbplus/issues)**" page on GitHub. When reporting a bug, please write the report as detailed and specifically as possible. Note the steps to reproduce the bug and include screen captures if possible.

For questions, please also post them under the "**[Issues](https://github.com/oel-mediateam/sbplus/issues)**" page on GitHub.

---
###License
Storybook Plus (SB+) is licensed under [GNU v3](https://github.com/oel-mediateam/sbplus/blob/master/LICENSE) license. Copyright (c) 2013-2016 Ethan S. Lin, [University of Wisconsin-Extension, Division of Continuing Education, Outreach & E-Learning](http://ce.uwex.edu/)

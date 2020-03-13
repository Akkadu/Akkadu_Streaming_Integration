# [![Akkadu][akkadu-logo]][akkadu-url] Github Template Javascript

<!-- PROJECT SHIELDS -->
<!--
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
*** See bottom of page for list of reference links
-->
[![Netlify Status][netlify-shield]][netlify-url]
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![Language grade: JavaScript][lgtm-shield]][lgtm-url]
[![FOSSA Status][fossa-shield]][fossa-url]
![Version][version-shield]
[![Maintenance][maintenance-shield]][maintenance-url]
[![David Dependencies Status][david-dm-shield]][david-dm-url]
[![styled with prettier][prettier-shield]][prettier-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

Get started on Javascript projects at Akkadu much quicker by using this template repository.

[Explore the docs »](https://github.com/Akkadu/github-template-javascript)

[View Demo](https://github.com/Akkadu/github-template-javascript) • [Report Bug](https://github.com/Akkadu/github-template-javascript/issues) • [Request Feature](https://github.com/Akkadu/github-template-javascript/issues)

<!-- TABLE OF CONTENTS -->
## Table of Contents

* [About the Project](#about-the-project)
  * [Built With](#built-with)
* [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
* [Usage](#usage)
* [Roadmap](#roadmap)
* [Contributing](#contributing)
* [License](#license)
* [Contact](#contact)
* [Acknowledgements](#acknowledgements)

<!-- ABOUT THE PROJECT -->
## About The Project

[![Product Name Screen Shot][product-screenshot]](https://example.com)

This is a project designed to reduce new project overhead, decrease cost of project maintenance, and enforce standardization of project management tools (e.g. linters, READMEs, Issue templates, etc.).

Here's why:

Spending time writing a good README shouldn't be a pain for every new project on our platform. If you add PR templates, Issue templates, lint configs, .gitignore files, etc., the task of creating new repositories eventually becomes hours of finding things to copy/paste.

* Your time should be focused on creating something amazing. A project that solves a problem and helps others
* You shouldn't be doing the same tasks over and over like creating a README from scratch
* You should element DRY principles to the rest of your life :smile:

This is by no means a one-size-fits-all solution, but it should get you started much quicker than trying to pull together the latest best practices from who knows where only to find out the standards are changing.

A list of commonly used resources that I find helpful are listed in the acknowledgements.

### Built With

This section should list any major frameworks that you built your project using. Leave any add-ons/plugins for the acknowledgements section. Here are a few examples.

* [Buefy](https://buefy.org)
* [Nuxt](https://nuxtjs.org)
* [Express](https://expressjs.com)

<!-- GETTING STARTED -->
## Getting Started

This is an example of how you may give instructions on setting up your project locally.
To get a local copy up and running follow these simple example steps.

### Prerequisites

This is an example of how to list things you need to use the software and how to install them.

* yarn

```sh
npm install yarn@latest -g
```

### Installation

1. Clone the repo
2. Get the .env keys from techforce@akkadu-team.com

```sh
git clone https://github.com/Akkadu/github-template-javascript.git
```

3. Install NPM packages

```sh
yarn install
```

<!-- USAGE EXAMPLES -->
## Usage

Use this space to show useful examples of how a project can be used. Additional screenshots, code examples and demos work well in this space. You may also link to more resources.

Update your project's .github templates

```sh
mkdir -p .github
echo 'Downloading latest "contributing.md"...'
curl https://raw.githubusercontent.com/Akkadu/github-template-javascript/master/.github/contributing.md -o .github/contributing.md
echo 'Downloading latest "issue_template.md"...'
curl https://raw.githubusercontent.com/Akkadu/github-template-javascript/master/.github/issue_template.md -o .github/issue_template.md
echo 'Downloading latest "pull_request_template.md"...'
curl https://raw.githubusercontent.com/Akkadu/github-template-javascript/master/.github/pull_request_template.md -o .github/pull_request_template.md
echo 'Success!'
```

Download the template README.md

```sh
curl -K https://raw.githubusercontent.com/Akkadu/github-template-javascript/master/README.md -o README.md
```

<!-- ROADMAP -->
## Roadmap

See the [open issues](https://github.com/Akkadu/github-template-javascript/issues) for a list of proposed features (and known issues)

<!-- CONTRIBUTING -->
## Contributing

Want to make a change? Any contributions you make are **greatly appreciated**.

1. Clone the repo
2. Create your Feature Branch (`gco -b release/my-project`)
3. Commit your Changes (`git commit -m 'add: small addition'`)
4. Push to the Branch (`git push origin release/my-project`)
5. Open a Pull Request

<!-- AUTHORS -->
## Author

👤 **JT Houk <jt1992@gmail.com>**

* Website: [jt.houk.space](https://jt.houk.space/)
* Twitter: [@HoukasaurusRex](https://twitter.com/HoukasaurusRex)
* Github: [@HoukasaurusRex](https://github.com/HoukasaurusRex)
* LinkedIn: [@JT Houk](https://linkedin.com/in/jt-houk)

<!-- DEPENDENCIES -->
## Dependencies

[![FOSSA Status][fossa-scan]][fossa-url]

<!-- ACKNOWLEDGEMENTS -->
## Acknowledgements

* [Best README Template](https://github.com/othneildrew/Best-README-Template/blob/master/README.md)
* [GitHub Emoji Cheat Sheet](https://www.webpagefx.com/tools/emoji-cheat-sheet)
* [Img Shields](https://shields.io)

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[akkadu-logo]: https://res.cloudinary.com/jthouk/image/upload/e_improve,w_30,h_30/v1570345513/Logos/akkadu-logo-white-simple.png
[akkadu-url]: https://akkadu.com
[netlify-shield]: https://api.netlify.com/api/v1/badges/db1500c5-d307-4fa7-acd0-60543ece4624/deploy-status
[netlify-url]: https://app.netlify.com/sites/github-template-javascript/deploys
[contributors-shield]: https://img.shields.io/github/contributors/Akkadu/github-template-javascript.svg?style=flat-square
[contributors-url]: https://github.com/Akkadu/github-template-javascript/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/Akkadu/github-template-javascript.svg?style=flat-square
[forks-url]: https://github.com/Akkadu/github-template-javascript/network/members
[stars-shield]: https://img.shields.io/github/stars/Akkadu/github-template-javascript.svg?style=flat-square
[stars-url]: https://github.com/Akkadu/github-template-javascript/stargazers
[issues-shield]: https://img.shields.io/github/issues/Akkadu/github-template-javascript.svg?style=flat-square
[issues-url]: https://github.com/Akkadu/github-template-javascript/issues
[license-shield]: https://img.shields.io/github/license/Akkadu/github-template-javascript.svg?style=flat-square
[license-url]: https://github.com/Akkadu/github-template-javascript/blob/master/LICENSE.txt
[lgtm-shield]: https://img.shields.io/lgtm/grade/javascript/g/akkadu/github-template-javascript.svg?logo=lgtm&logoWidth=18
[lgtm-url]: https://lgtm.com/projects/g/akkadu/github-template-javascript/context:javascript
[fossa-shield]: https://app.fossa.com/api/projects/git%2Bgithub.com%2FAkkadu%2Fgithub-template-javascript.svg?type=shield
[fossa-url]: https://app.fossa.com/projects/git%2Bgithub.com%2FAkkadu%2Fgithub-template-javascript?ref=badge_shield
[fossa-scan]: https://app.fossa.com/api/projects/git%2Bgithub.com%2FAkkadu%2Fgithub-template-javascript.svg?type=large
[version-shield]: https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000
[maintenance-shield]: https://img.shields.io/badge/Maintained%3F-yes-green.svg
[maintenance-url]: https://github.com/Akkadu/github-template-javascript/graphs/commit-activity
[david-dm-shield]: https://david-dm.org/akkadu/github-template-javascript.svg
[david-dm-url]: https://david-dm.org/akkadu/github-template-javascript
[prettier-shield]: https://img.shields.io/badge/styled_with-prettier-ff69b4.svg
[prettier-url]: https://github.com/prettier/prettier
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=flat-square&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/company/akkadu/
[product-screenshot]: https://raw.githubusercontent.com/ritaly/README-cheatsheet/master/img/screenshot.png
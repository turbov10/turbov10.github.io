const fs = require("fs");
const path = require("path");

module.exports = {
    // VuePress Config Documentation: https://vuepress.vuejs.org/zh/config/

    /**
     * [base] defines the base direction of any pages and assets resources.
     * Changing this config will impact Nignx config, Dockfile COPY path and Kubernetes Helm Ingress config in cdp-web.
     */
    base: '/docs/',

    // dest: '.vuepress/dist',

    title: 'Turbo-v10 Documentations',
    description: 'Turbo-v10 Documentations',
    head: [
        [ 'link', { rel: 'icon', href: '/favicon.ico' } ]
    ],

    cache: false,
    /** Specify which pattern of files you want to be resolved. */
    patterns: [ '**/*.md', '**/*.vue' ],

    /*-------------------- config for dev server --------------------*/

    /** [port] is only specified to be used for the dev server. */
    port: 9001,
    /**
     * Specify extra files to watch.
     * You can watch any file if you want. File changes will trigger vuepress rebuilding and real-time updates.
     */
    extraWatchFiles: [ '**/*.md', '**/*.vue', '**/*.styl' ],

    /*-------------------- default theme config --------------------*/
    themeConfig: {
        logo: '/img/favicon.ico',
        activeHeaderLinks: true, // default value is TRUE
        lastUpdated: 'Last Updated',
        // nav: [
        //     { text: 'Overview', link: '/cdp/' },
        //     { text: 'Release Management', link: '/releases/' },
        //     { text: 'Open Change Pipeline', link: '/change/' },
        //     { text: 'CMC', link: '/cmc/' },
        //     { text: 'RMC', link: '/rmc/' },
        //     { text: 'Build Console', link: '/build/' },
        //     // { text: 'Building Console', link: '/building/' },
        //     {
        //         text: 'Quick Links',
        //         items: [
        //             { text: 'CDP (Continuous Deployment Portal)', link: 'https://csgcdp.webex.com', target: '_blank' },
        //             { text: 'CDP User Guide', link: 'https://wiki.cisco.com/display/WEBEXRM/CDP+User+Guide+-+Release+Management', target: '_blank' },
        //             { text: 'CMC (Configuration Management Controller)', link: 'https://csgcmc.webex.com', target: '_blank' },
        //             { text: 'CD(Change Dashboard)', link: 'http://sdp.webex.com/changedashboard/index', target: '_blank' }
        //         ]
        //     },
        // ],
        //
        // sidebar: {
        //     "/releases/":getSideBar('releases'),
        //     "/change/":getSideBar('change'),
        //     "/cmc/":getSideBar('cmc'),
        //     "/rmc/":getSideBar('rmc'),
        //     '/cdp/': getSideBar('cdp'),
        //     '/build/': getSideBar('build'),
        //     "/" : [ '' ],
        // }
    },
};

function getSideBar(folder) {
    let children = fs
        .readdirSync(path.join(`${__dirname}/../${folder}`))
        .map(f => {
            if (f.toLowerCase() === 'readme.md') {
                return '';
            } else if (f.endsWith('.md')) {
                let _f = folder + '/' + f;
                return _f
                    .replace(/\.md$/gi, '')
                    .replace(/^[^\/]*\//g, '');
            } else {
                let _title = getFolderTitle(f);
                let _nextFolder = `${folder}/${f}`;
                let _children = getSideBar(_nextFolder);
                if (_title === 'Release Notes') {
                    _children.sort(sortVersionBuildByTitle);
                }

                return {
                    title: _title,
                    children: _children
                }
            }
        })

    return [ ...children ];
}

function getFolderTitle(folder) {
    if (/^features?$/gi.test(folder)) {
        return 'Features';
    } else if (/^design$/gi.test(folder)) {
        return 'Design';
    } else if (/^releases?.*notes?$/gi.test(folder)) {
        return 'Release Notes'
    } else if (/^pipelines?$/gi.test(folder)) {
        return 'Pipelines'
    } else if (/^user-story?$/gi.test(folder)) {
        return 'User Story'
    } else if(/^customer-success-stories?$/gi.test(folder)){
        return 'Customer Success Stories'
    } else if(/^release-as-code?$/gi.test(folder)){
        return 'Release As Code'
    }

    return '';
}

function sortVersionBuildByTitle(f1, f2) {
    if (f1 && f2 && f1.includes('latest')) {
        return -1;
    } else {
        if (f1 && f2) {
            let _f1 = f1.split('/')[f1.split('/').length - 1];
            let _f2 = f2.split('/')[f2.split('/').length - 1];
            let _v1 = _f1.split(/[_\\.]/);
            let _v2 = _f2.split(/[_\\.]/);
            let i = 0;
            while (i < _v1.length && i < _v2.length) {
                let r = 0;
                if (/^\d+$/.test(_v1[i].trim()) && /^\d+$/.test(_v2[i].trim())) {
                    r = parseInt(_v2[i]) - parseInt(_v1[i]);
                } else {
                    r = (_v1[i] === _v2[i]) ? 0 : ((_v1[i] < _v2[i]) ? 1 : -1);
                }

                if (r !== 0) {
                    return r
                }

                i++;
            }
        }

        return f1 < f2 ? 1 : -1;
    }
}
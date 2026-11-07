// The harbor theme's script (linked deferred in footer.html, after the
// engine's app.js): sharing under a text (social_share.html) and the
// contents of a long text at the top of the sidebar.
//
// harborShare - a behavior: in a [data-h-share] row the share button
// ([data-h-share-native]) is shown where the browser has its own share
// sheet (navigator.share) and opens it with the row's data-h-url and
// data-h-title; the copy button ([data-h-copy]) puts the address on the
// clipboard and says so for two seconds (its data-h-copied, translated
// in the template).
//
// The contents - on a content page with the sidebar (.h-side) whose
// text (the first .node-content of article.node) has three headings
// h2-h3 or more, unless the theme's "toc" setting is off (data-toc="0"
// on <html>): a card listing them at the top of the sidebar (sticky
// there on a wide screen, harbor.css); the heading being read is marked
// (aria-current). Headings without an id get one from their text.
(function () {
    'use strict';

    Kosatka.behaviors = Kosatka.behaviors || {};

    Kosatka.behaviors.harborShare = {
        attach: function (context) {
            Kosatka.once('harbor-share', '[data-h-share]', context).forEach(function (row) {
                var url = row.getAttribute('data-h-url') || window.location.href;
                var title = row.getAttribute('data-h-title') || document.title;

                var native = row.querySelector('[data-h-share-native]');
                if (native && navigator.share) {
                    native.hidden = false;
                    native.addEventListener('click', function () {
                        navigator.share({title: title, url: url}).catch(function () {});
                    });
                }

                var copy = row.querySelector('[data-h-copy]');
                var label = copy && copy.querySelector('[data-h-copy-label]');
                if (!copy || !label) return;
                if (!navigator.clipboard || !navigator.clipboard.writeText) {
                    copy.hidden = true;
                    return;
                }
                var text = label.textContent;
                var timer = null;
                copy.addEventListener('click', function () {
                    navigator.clipboard.writeText(url).then(function () {
                        label.textContent = copy.getAttribute('data-h-copied') || text;
                        copy.classList.add('is-copied');
                        clearTimeout(timer);
                        timer = setTimeout(function () {
                            label.textContent = text;
                            copy.classList.remove('is-copied');
                        }, 2000);
                    }, function () {});
                });
            });
        }
    };

    // slug - an id from a heading's text: letters and digits of any
    // script, the rest as hyphens.
    function slug(text) {
        return text.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'section';
    }

    function contents() {
        if (document.documentElement.getAttribute('data-toc') === '0') return;
        var side = document.querySelector('.h-side');
        var text = document.querySelector('article.node .node-content');
        if (!side || !text) return;
        var headings = Array.prototype.slice.call(text.querySelectorAll('h2, h3'));
        if (headings.length < 3) return;

        var nav = document.createElement('nav');
        nav.className = 'h-toc';
        nav.setAttribute('aria-labelledby', 'h-toc-title');
        var title = document.createElement('h2');
        title.id = 'h-toc-title';
        title.textContent = Kosatka.t('Contents');
        nav.appendChild(title);
        var list = document.createElement('ol');
        var links = [];
        headings.forEach(function (h) {
            if (!h.id) {
                var id = slug(h.textContent), n = 2;
                while (document.getElementById(id)) id = slug(h.textContent) + '-' + n++;
                h.id = id;
            }
            var li = document.createElement('li');
            if (h.tagName === 'H3') li.className = 'h-toc-sub';
            var a = document.createElement('a');
            a.href = '#' + h.id;
            a.textContent = h.textContent.trim();
            li.appendChild(a);
            list.appendChild(li);
            links.push({heading: h, link: a});
        });
        nav.appendChild(list);
        side.insertBefore(nav, side.firstChild);

        // The heading being read: the last one above the top quarter of
        // the window.
        if (!('IntersectionObserver' in window)) return;
        var current = null;
        function mark() {
            var line = window.innerHeight / 4, active = links[0];
            links.forEach(function (l) {
                if (l.heading.getBoundingClientRect().top <= line) active = l;
            });
            if (active === current) return;
            if (current) current.link.removeAttribute('aria-current');
            active.link.setAttribute('aria-current', 'true');
            current = active;
        }
        var io = new IntersectionObserver(mark, {rootMargin: '0px 0px -75% 0px'});
        links.forEach(function (l) { io.observe(l.heading); });
        mark();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', contents);
    } else {
        contents();
    }
})();

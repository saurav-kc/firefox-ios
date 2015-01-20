/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// If this is http or https content, and not an index page, then try to run Readability. If anything
// fails, the app will never be notified and we don't show the button. That is ok for now since there
// is no error feedback possible anyway.

var mozReadabilityResult;

function mozCheckReadability() {
    if ((document.location.protocol === "http:" || document.location.protocol === "https:") && document.location.pathname !== "/") {
        // Short circuit in case we already ran Readability. This mostly happens when going
        // back/forward: the page will be cached and the result will still be there.
        if (mozReadabilityResult && mozReadabilityResult.content) {
            webkit.messageHandlers.readerModeMessageHandler.postMessage("Available");
        } else {
            var uri = {
            spec: document.location.href,
            host: document.location.host,
            prePath: document.location.protocol + "//" + document.location.host, // TODO This is incomplete, needs username/password and port
            scheme: document.location.protocol,
            pathBase: document.location.protocol + "//" + document.location.host + location.pathname.substr(0, location.pathname.lastIndexOf("/") + 1)
            }
            console.log(uri);
            var mozReadability = new Readability(uri, document.cloneNode(true));
            mozReadabilityResult = mozReadability.parse();
            webkit.messageHandlers.readerModeMessageHandler.postMessage(mozReadabilityResult !== null ? "Available" : "Unavailable");
        }
    } else if (document.location.protocol === "about:" && document.location.pathname === "reader") {
        webkit.messageHandlers.readerModeMessageHandler.postMessage("Active");
    } else {
        webkit.messageHandlers.readerModeMessageHandler.postMessage("Unavailable");
    }
}

function mozSimplifyReaderDomain(domain) {
    domain = domain.toLowerCase();
    if (domain.indexOf("www.") == 0) {
        domain = domain.substring(4);
    }
    return domain;
}

function mozReaderize() {
    if (mozReadabilityResult) {
        var template = mozReaderModeTemplate();
        template = template.replace("%READER-DOMAIN%", mozSimplifyReaderDomain(mozReadabilityResult.uri.host));
        template = template.replace("%READER-URL%", mozReadabilityResult.uri.spec);
        template = template.replace("%READER-CONTENT%", mozReadabilityResult.content);
        template = template.replace("%READER-TITLE%", mozReadabilityResult.title);
        template = template.replace("%READER-MESSAGE%", "");
        return template;
    } else {
        return "<p>This should not happen</p>";
    }
}

// This is inline here because I don't have a good answer just yet about loading non-js content into
// the sandboxed javascript world. This is far from ideal but will be addressed in a next iteration.

function mozReaderModeTemplate() {
    var s = "PCFET0NUWVBFIGh0bWw+CjxodG1sPgoKPGhlYWQ+CiAgPG1ldGEgY29udGVudD0idGV4dC9odG1sOyBjaGFyc2V0PVVURi04IiBodHRwLWVxdWl2PSJjb250ZW50LXR5cGUiPgogIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJpbml0aWFsLXNjYWxlPTEuMCwgdXNlci1zY2FsYWJsZT1ubyI+CiAgCiAgPHN0eWxlIHR5cGU9InRleHQvY3NzIj4KICAgICAgaHRtbCB7CiAgICAgICAgICAtbW96LXRleHQtc2l6ZS1hZGp1c3Q6IG5vbmU7CiAgICAgIH0KICAKICBib2R5IHsKICAgICAgcGFkZGluZzogMjBweDsKICAgICAgdHJhbnNpdGlvbi1wcm9wZXJ0eTogYmFja2dyb3VuZC1jb2xvciwgY29sb3I7CiAgICAgIHRyYW5zaXRpb24tZHVyYXRpb246IDAuNHM7CiAgICAgIG1heC13aWR0aDogMzVlbTsKICAgICAgbWFyZ2luLWxlZnQ6IGF1dG87CiAgICAgIG1hcmdpbi1yaWdodDogYXV0bzsKICAgICAgZm9udC1mYW1pbHk6ICJWZXJkYW5hIjsKICB9CiAgCiAgLmxpZ2h0IHsKICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZmZmZjsKICAgICAgY29sb3I6ICMyMjIyMjI7CiAgfQogIAogIC5kYXJrIHsKICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzAwMDAwMDsKICAgICAgY29sb3I6ICNlZWVlZWU7CiAgfQogIAogIC5zYW5zLXNlcmlmIHsKICAgICAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7CiAgfQogIAogIC5zZXJpZiB7CiAgICAgIGZvbnQtZmFtaWx5OiBzZXJpZjsKICB9CiAgCiAgLm1lc3NhZ2UgewogICAgICBtYXJnaW4tdG9wOiA0MHB4OwogICAgICBYWFhkaXNwbGF5OiBub25lOwogICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7CiAgICAgIHdpZHRoOiAxMDAlOwogICAgICBmb250LXNpemU6IDE2cHg7CiAgfQogIAogIC5oZWFkZXIgewogICAgICB0ZXh0LWFsaWduOiBzdGFydDsKICAgICAgWFhYZGlzcGxheTogbm9uZTsKICB9CiAgCiAgLmRvbWFpbiwKICAuY3JlZGl0cyB7CiAgICAgIGZvbnQtZmFtaWx5OiBzYW5zLXNlcmlmOwogIH0KICAKICAuZG9tYWluIHsKICAgICAgbWFyZ2luLXRvcDogMTBweDsKICAgICAgcGFkZGluZy1ib3R0b206IDEwcHg7CiAgICAgIGNvbG9yOiAjMDBhY2ZmICFpbXBvcnRhbnQ7CiAgICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTsKICB9CiAgCiAgLmRvbWFpbi1ib3JkZXIgewogICAgICBtYXJnaW4tdG9wOiAxNXB4OwogICAgICBib3JkZXItYm90dG9tOiAxLjVweCBzb2xpZCAjNzc3Nzc3OwogICAgICB3aWR0aDogNTAlOwogIH0KICAKICAuaGVhZGVyID4gaDEgewogICAgICBmb250LXNpemU6IDEuNjI1ZW07CiAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7CiAgICAgIGxpbmUtaGVpZ2h0OiAxLjFlbTsKICAgICAgd2lkdGg6IDEwMCU7CiAgICAgIG1hcmdpbjogMHB4OwogICAgICBtYXJnaW4tdG9wOiAzMnB4OwogICAgICBtYXJnaW4tYm90dG9tOiAxNnB4OwogICAgICBwYWRkaW5nOiAwcHg7CiAgfQogIAogIC5oZWFkZXIgPiAuY3JlZGl0cyB7CiAgICAgIHBhZGRpbmc6IDBweDsKICAgICAgbWFyZ2luOiAwcHg7CiAgICAgIG1hcmdpbi1ib3R0b206IDMycHg7CiAgfQogIAogIC5saWdodCA+IC5oZWFkZXIgPiAuZG9tYWluIHsKICAgICAgY29sb3I6ICNlZTc2MDA7CiAgICAgIGJvcmRlci1ib3R0b20tY29sb3I6ICNkMGQwZDA7CiAgfQogIAogIC5saWdodCA+IC5oZWFkZXIgPiBoMSB7CiAgICAgIGNvbG9yOiAjMjIyMjIyOwogIH0KICAKICAubGlnaHQgPiAuaGVhZGVyID4gLmNyZWRpdHMgewogICAgICBjb2xvcjogIzg5ODk4OTsKICB9CiAgCiAgLmRhcmsgPiAuaGVhZGVyID4gLmRvbWFpbiB7CiAgICAgIGNvbG9yOiAjZmY5NDAwOwogICAgICBib3JkZXItYm90dG9tLWNvbG9yOiAjNzc3Nzc3OwogIH0KICAKICAuZGFyayA+IC5oZWFkZXIgPiBoMSB7CiAgICAgIGNvbG9yOiAjZWVlZWVlOwogIH0KICAKICAuZGFyayA+IC5oZWFkZXIgPiAuY3JlZGl0cyB7CiAgICAgIGNvbG9yOiAjYWFhYWFhOwogIH0KICAKICAuZm9udC1zaXplMSA+IC5oZWFkZXIgPiBoMSB7CiAgICAgIGZvbnQtc2l6ZTogMjdweDsKICB9CiAgCiAgLmZvbnQtc2l6ZTIgPiAuaGVhZGVyID4gaDEgewogICAgICBmb250LXNpemU6IDI5cHg7CiAgfQogIAogIC5mb250LXNpemUzID4gLmhlYWRlciA+IGgxIHsKICAgICAgZm9udC1zaXplOiAzMXB4OwogIH0KICAKICAuZm9udC1zaXplNCA+IC5oZWFkZXIgPiBoMSB7CiAgICAgIGZvbnQtc2l6ZTogMzNweDsKICB9CiAgCiAgLmZvbnQtc2l6ZTUgPiAuaGVhZGVyID4gaDEgewogICAgICBmb250LXNpemU6IDM1cHg7CiAgfQogIAogIC8qIFRoaXMgY292ZXJzIGNhcHRpb24sIGRvbWFpbiwgYW5kIGNyZWRpdHMKICAgdGV4dHMgaW4gdGhlIHJlYWRlciBVSSAqLwogIAogIC5mb250LXNpemUxID4gLmNvbnRlbnQgLndwLWNhcHRpb24tdGV4dCwKICAuZm9udC1zaXplMSA+IC5jb250ZW50IGZpZ2NhcHRpb24sCiAgLmZvbnQtc2l6ZTEgPiAuaGVhZGVyID4gLmRvbWFpbiwKICAuZm9udC1zaXplMSA+IC5oZWFkZXIgPiAuY3JlZGl0cyB7CiAgICAgIGZvbnQtc2l6ZTogMTBweDsKICB9CiAgCiAgLmZvbnQtc2l6ZTIgPiAuY29udGVudCAud3AtY2FwdGlvbi10ZXh0LAogIC5mb250LXNpemUyID4gLmNvbnRlbnQgZmlnY2FwdGlvbiwKICAuZm9udC1zaXplMiA+IC5oZWFkZXIgPiAuZG9tYWluLAogIC5mb250LXNpemUyID4gLmhlYWRlciA+IC5jcmVkaXRzIHsKICAgICAgZm9udC1zaXplOiAxM3B4OwogIH0KICAKICAuZm9udC1zaXplMyA+IC5jb250ZW50IC53cC1jYXB0aW9uLXRleHQsCiAgLmZvbnQtc2l6ZTMgPiAuY29udGVudCBmaWdjYXB0aW9uLAogIC5mb250LXNpemUzID4gLmhlYWRlciA+IC5kb21haW4sCiAgLmZvbnQtc2l6ZTMgPiAuaGVhZGVyID4gLmNyZWRpdHMgewogICAgICBmb250LXNpemU6IDE1cHg7CiAgfQogIAogIC5mb250LXNpemU0ID4gLmNvbnRlbnQgLndwLWNhcHRpb24tdGV4dCwKICAuZm9udC1zaXplNCA+IC5jb250ZW50IGZpZ2NhcHRpb24sCiAgLmZvbnQtc2l6ZTQgPiAuaGVhZGVyID4gLmRvbWFpbiwKICAuZm9udC1zaXplNCA+IC5oZWFkZXIgPiAuY3JlZGl0cyB7CiAgICAgIGZvbnQtc2l6ZTogMTdweDsKICB9CiAgCiAgLmZvbnQtc2l6ZTUgPiAuY29udGVudCAud3AtY2FwdGlvbi10ZXh0LAogIC5mb250LXNpemU1ID4gLmNvbnRlbnQgZmlnY2FwdGlvbiwKICAuZm9udC1zaXplNSA+IC5oZWFkZXIgPiAuZG9tYWluLAogIC5mb250LXNpemU1ID4gLmhlYWRlciA+IC5jcmVkaXRzIHsKICAgICAgZm9udC1zaXplOiAxOXB4OwogIH0KICAKICAuY29udGVudCB7CiAgICAgIFhYWGRpc3BsYXk6IG5vbmU7CiAgfQogIAogIC5jb250ZW50IGEgewogICAgICB0ZXh0LWRlY29yYXRpb246IHVuZGVybGluZSAhaW1wb3J0YW50OwogICAgICBmb250LXdlaWdodDogbm9ybWFsOwogIH0KICAKICAubGlnaHQgPiAuY29udGVudCBhLAogIC5saWdodCA+IC5jb250ZW50IGE6dmlzaXRlZCwKICAubGlnaHQgPiAuY29udGVudCBhOmhvdmVyLAogIC5saWdodCA+IC5jb250ZW50IGE6YWN0aXZlIHsKICAgICAgY29sb3I6ICMwMGFjZmYgIWltcG9ydGFudDsKICB9CiAgCiAgLmRhcmsgPiAuY29udGVudCBhLAogIC5kYXJrID4gLmNvbnRlbnQgYTp2aXNpdGVkLAogIC5kYXJrID4gLmNvbnRlbnQgYTpob3ZlciwKICAuZGFyayA+IC5jb250ZW50IGE6YWN0aXZlIHsKICAgICAgY29sb3I6ICMwMGFjZmYgIWltcG9ydGFudDsKICB9CiAgCiAgLmNvbnRlbnQgKiB7CiAgICAgIG1heC13aWR0aDogMTAwJSAhaW1wb3J0YW50OwogICAgICBoZWlnaHQ6IGF1dG8gIWltcG9ydGFudDsKICB9CiAgCiAgLmNvbnRlbnQgcCB7CiAgICAgIGxpbmUtaGVpZ2h0OiAxLjRlbSAhaW1wb3J0YW50OwogICAgICBtYXJnaW46IDBweCAhaW1wb3J0YW50OwogICAgICBtYXJnaW4tYm90dG9tOiAyMHB4ICFpbXBvcnRhbnQ7CiAgfQogIAogIC8qIENvdmVycyBhbGwgaW1hZ2VzIHNob3dpbmcgZWRnZS10by1lZGdlIHVzaW5nIGEKICAgYW4gb3B0aW9uYWwgY2FwdGlvbiB0ZXh0ICovCiAgLmNvbnRlbnQgLndwLWNhcHRpb24sCiAgLmNvbnRlbnQgZmlndXJlIHsKICAgICAgZGlzcGxheTogYmxvY2sgIWltcG9ydGFudDsKICAgICAgd2lkdGg6IDEwMCUgIWltcG9ydGFudDsKICAgICAgbWFyZ2luOiAwcHggIWltcG9ydGFudDsKICAgICAgbWFyZ2luLWJvdHRvbTogMzJweCAhaW1wb3J0YW50OwogIH0KICAKICAvKiBJbWFnZXMgbWFya2VkIHRvIGJlIHNob3duIGVkZ2UtdG8tZWRnZSB3aXRoIGFuCiAgIG9wdGlvbmFsIGNhcHRpbyBudGV4dCAqLwogIC5jb250ZW50IHAgPiBpbWc6b25seS1jaGlsZCwKICAuY29udGVudCBwID4gYTpvbmx5LWNoaWxkID4gaW1nOm9ubHktY2hpbGQsCiAgLmNvbnRlbnQgLndwLWNhcHRpb24gaW1nLAogIC5jb250ZW50IGZpZ3VyZSBpbWcgewogICAgICBtYXgtd2lkdGg6IG5vbmUgIWltcG9ydGFudDsKICAgICAgaGVpZ2h0OiBhdXRvICFpbXBvcnRhbnQ7CiAgICAgIGRpc3BsYXk6IGJsb2NrICFpbXBvcnRhbnQ7CiAgICAgIG1hcmdpbi10b3A6IDBweCAhaW1wb3J0YW50OwogICAgICBtYXJnaW4tYm90dG9tOiAzMnB4ICFpbXBvcnRhbnQ7CiAgfQogIAogIC8qIElmIGltYWdlIGlzIHBsYWNlIGluc2lkZSBvbmUgb2YgdGhlc2UgYmxvY2tzCiAgIHRoZXJlJ3Mgbm8gbmVlZCB0byBhZGQgbWFyZ2luIGF0IHRoZSBib3R0b20gKi8KICAuY29udGVudCAud3AtY2FwdGlvbiBpbWcsCiAgLmNvbnRlbnQgZmlndXJlIGltZyB7CiAgICAgIG1hcmdpbi1ib3R0b206IDBweCAhaW1wb3J0YW50OwogIH0KICAKICAvKiBJbWFnZSBjYXB0aW9uIHRleHQgKi8KICAuY29udGVudCAuY2FwdGlvbiwKICAuY29udGVudCAud3AtY2FwdGlvbi10ZXh0LAogIC5jb250ZW50IGZpZ2NhcHRpb24gewogICAgICBmb250LWZhbWlseTogc2Fucy1zZXJpZjsKICAgICAgbWFyZ2luOiAwcHggIWltcG9ydGFudDsKICAgICAgcGFkZGluZy10b3A6IDRweCAhaW1wb3J0YW50OwogIH0KICAKICAubGlnaHQgPiAuY29udGVudCAuY2FwdGlvbiwKICAubGlnaHQgPiAuY29udGVudCAud3AtY2FwdGlvbi10ZXh0LAogIC5saWdodCA+IC5jb250ZW50IGZpZ2NhcHRpb24gewogICAgICBjb2xvcjogIzg5ODk4OTsKICB9CiAgCiAgLmRhcmsgPiAuY29udGVudCAuY2FwdGlvbiwKICAuZGFyayA+IC5jb250ZW50IC53cC1jYXB0aW9uLXRleHQsCiAgLmRhcmsgPiAuY29udGVudCBmaWdjYXB0aW9uIHsKICAgICAgY29sb3I6ICNhYWFhYWE7CiAgfQogIAogIC8qIEVuc3VyZSBhbGwgcHJlLWZvcm1hdHRlZCBjb2RlIGluc2lkZSB0aGUgcmVhZGVyIGNvbnRlbnQKICAgYXJlIHByb3Blcmx5IHdyYXBwZWQgaW5zaWRlIGNvbnRlbnQgd2lkdGggKi8KICAuY29udGVudCBjb2RlLAogIC5jb250ZW50IHByZSB7CiAgICAgIHdoaXRlLXNwYWNlOiBwcmUtd3JhcCAhaW1wb3J0YW50OwogICAgICBtYXJnaW4tYm90dG9tOiAyMHB4ICFpbXBvcnRhbnQ7CiAgfQogIAogIC5jb250ZW50IGJsb2NrcXVvdGUgewogICAgICBtYXJnaW46IDBweCAhaW1wb3J0YW50OwogICAgICBtYXJnaW4tYm90dG9tOiAyMHB4ICFpbXBvcnRhbnQ7CiAgICAgIHBhZGRpbmc6IDBweCAhaW1wb3J0YW50OwogICAgICAtbW96LXBhZGRpbmctc3RhcnQ6IDE2cHggIWltcG9ydGFudDsKICAgICAgYm9yZGVyOiAwcHggIWltcG9ydGFudDsKICAgICAgYm9yZGVyLWxlZnQ6IDJweCBzb2xpZCAhaW1wb3J0YW50OwogIH0KICAKICAubGlnaHQgPiAuY29udGVudCBibG9ja3F1b3RlIHsKICAgICAgY29sb3I6ICM4OTg5ODkgIWltcG9ydGFudDsKICAgICAgYm9yZGVyLWxlZnQtY29sb3I6ICNkMGQwZDAgIWltcG9ydGFudDsKICB9CiAgCiAgLmRhcmsgPiAuY29udGVudCBibG9ja3F1b3RlIHsKICAgICAgY29sb3I6ICNhYWFhYWEgIWltcG9ydGFudDsKICAgICAgYm9yZGVyLWxlZnQtY29sb3I6ICM3Nzc3NzcgIWltcG9ydGFudDsKICB9CiAgCiAgLmNvbnRlbnQgdWwsCiAgLmNvbnRlbnQgb2wgewogICAgICBtYXJnaW46IDBweCAhaW1wb3J0YW50OwogICAgICBtYXJnaW4tYm90dG9tOiAyMHB4ICFpbXBvcnRhbnQ7CiAgICAgIHBhZGRpbmc6IDBweCAhaW1wb3J0YW50OwogICAgICBsaW5lLWhlaWdodDogMS41ZW07CiAgfQogIAogIC5jb250ZW50IHVsIHsKICAgICAgLW1vei1wYWRkaW5nLXN0YXJ0OiAzMHB4ICFpbXBvcnRhbnQ7CiAgICAgIGxpc3Qtc3R5bGU6IGRpc2sgIWltcG9ydGFudDsKICB9CiAgCiAgLmNvbnRlbnQgb2wgewogICAgICAtbW96LXBhZGRpbmctc3RhcnQ6IDM1cHggIWltcG9ydGFudDsKICAgICAgbGlzdC1zdHlsZTogZGVjaW1hbCAhaW1wb3J0YW50OwogIH0KICAKICAuZm9udC1zaXplMS1zYW1wbGUsCiAgLmZvbnQtc2l6ZTEgPiAuY29udGVudCB7CiAgICAgIGZvbnQtc2l6ZTogMTRweCAhaW1wb3J0YW50OwogIH0KICAKICAuZm9udC1zaXplMi1zYW1wbGUsCiAgLmZvbnQtc2l6ZTIgPiAuY29udGVudCB7CiAgICAgIGZvbnQtc2l6ZTogMTZweCAhaW1wb3J0YW50OwogIH0KICAKICAuZm9udC1zaXplMy1zYW1wbGUsCiAgLmZvbnQtc2l6ZTMgPiAuY29udGVudCB7CiAgICAgIGZvbnQtc2l6ZTogMThweCAhaW1wb3J0YW50OwogIH0KICAKICAuZm9udC1zaXplNC1zYW1wbGUsCiAgLmZvbnQtc2l6ZTQgPiAuY29udGVudCB7CiAgICAgIGZvbnQtc2l6ZTogMjBweCAhaW1wb3J0YW50OwogIH0KICAKICAuZm9udC1zaXplNS1zYW1wbGUsCiAgLmZvbnQtc2l6ZTUgPiAuY29udGVudCB7CiAgICAgIGZvbnQtc2l6ZTogMjJweCAhaW1wb3J0YW50OwogIH0KICAKICAudG9vbGJhciB7CiAgICAgIGZvbnQtZmFtaWx5OiAiVmVyZGFuYSIsc2Fucy1zZXJpZjsKICAgICAgdHJhbnNpdGlvbi1wcm9wZXJ0eTogdmlzaWJpbGl0eSwgb3BhY2l0eTsKICAgICAgdHJhbnNpdGlvbi1kdXJhdGlvbjogMC43czsKICAgICAgdmlzaWJpbGl0eTogdmlzaWJsZTsKICAgICAgb3BhY2l0eTogMS4wOwogICAgICBwb3NpdGlvbjogZml4ZWQ7CiAgICAgIHdpZHRoOiAxMDAlOwogICAgICBib3R0b206IDBweDsKICAgICAgbGVmdDogMHB4OwogICAgICBtYXJnaW46IDA7CiAgICAgIHBhZGRpbmc6IDA7CiAgICAgIGxpc3Qtc3R5bGU6IG5vbmU7CiAgICAgIGJhY2tncm91bmQtY29sb3I6ICNFQkVCRjA7CiAgICAgIC1tb3otdXNlci1zZWxlY3Q6IG5vbmU7CiAgfQogIAogIC50b29sYmFyLWhpZGRlbiB7CiAgICAgIHRyYW5zaXRpb24tcHJvcGVydHk6IHZpc2liaWxpdHksIG9wYWNpdHk7CiAgICAgIHRyYW5zaXRpb24tZHVyYXRpb246IDAuN3M7CiAgICAgIHZpc2liaWxpdHk6IGhpZGRlbjsKICAgICAgb3BhY2l0eTogMC4wOwogIH0KICAKICAudG9vbGJhciA+ICogewogICAgICBmbG9hdDogcmlnaHQ7CiAgICAgIHdpZHRoOiAzMyU7CiAgfQogIAogIC5idXR0b24gewogICAgICBjb2xvcjogd2hpdGU7CiAgICAgIGRpc3BsYXk6IGJsb2NrOwogICAgICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiBjZW50ZXI7CiAgICAgIGJhY2tncm91bmQtc2l6ZTogMzBweCAyNHB4OwogICAgICBiYWNrZ3JvdW5kLXJlcGVhdDogbm8tcmVwZWF0OwogIH0KICAKICAuZHJvcGRvd24gewogICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7CiAgICAgIGRpc3BsYXk6IGlubGluZS1ibG9jazsKICAgICAgbGlzdC1zdHlsZTogbm9uZTsKICAgICAgbWFyZ2luOiAwcHg7CiAgICAgIHBhZGRpbmc6IDBweDsKICB9CiAgCiAgLmRyb3Bkb3duIGxpIHsKICAgICAgbWFyZ2luOiAwcHg7CiAgICAgIHBhZGRpbmc6IDBweDsKICB9CiAgCiAgLmRyb3Bkb3duLXRvZ2dsZSB7CiAgICAgIG1hcmdpbjogMHB4OwogICAgICBwYWRkaW5nOiAwcHg7CiAgfQogIAogIC5kcm9wZG93bi1wb3B1cCB7CiAgICAgIHRleHQtYWxpZ246IHN0YXJ0OwogICAgICBwb3NpdGlvbjogYWJzb2x1dGU7CiAgICAgIGxlZnQ6IDBweDsKICAgICAgei1pbmRleDogMTAwMDsKICAgICAgZmxvYXQ6IGxlZnQ7CiAgICAgIGJhY2tncm91bmQ6ICNFQkVCRjA7CiAgICAgIG1hcmdpbi10b3A6IDEycHg7CiAgICAgIG1hcmdpbi1ib3R0b206IDEwcHg7CiAgICAgIHBhZGRpbmctdG9wOiA0cHg7CiAgICAgIHBhZGRpbmctYm90dG9tOiA4cHg7CiAgICAgIGZvbnQtc2l6ZTogMTRweDsKICAgICAgYm94LXNoYWRvdzogMHB4IC0xcHggMTJweCAjMzMzOwogICAgICBib3JkZXItcmFkaXVzOiAzcHg7CiAgICAgIHZpc2liaWxpdHk6IGhpZGRlbjsKICB9CiAgCiAgLmRyb3Bkb3duLXBvcHVwID4gaHIgewogICAgICB3aWR0aDogMTAwJTsKICAgICAgaGVpZ2h0OiAwcHg7CiAgICAgIGJvcmRlcjogMHB4OwogICAgICBib3JkZXItdG9wOiAxcHggc29saWQgI0I1QjVCNTsKICAgICAgbWFyZ2luOiAwOwogIH0KICAKICAub3BlbiA+IC5kcm9wZG93bi1wb3B1cCB7CiAgICAgIG1hcmdpbi10b3A6IDBweDsKICAgICAgbWFyZ2luLWJvdHRvbTogNnB4OwogICAgICBib3R0b206IDEwMCU7CiAgICAgIHZpc2liaWxpdHk6IHZpc2libGU7CiAgfQogIAogIC5kcm9wZG93bi1hcnJvdyB7CiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTsKICAgICAgd2lkdGg6IDQwcHg7CiAgICAgIGhlaWdodDogMThweDsKICAgICAgYm90dG9tOiAtMThweDsKICAgICAgYmFja2dyb3VuZC1pbWFnZTogdXJsKCdjaHJvbWU6Ly9icm93c2VyL3NraW4vaW1hZ2VzL3JlYWRlci1kcm9wZG93bi1hcnJvdy1tZHBpLnBuZycpOwogICAgICBiYWNrZ3JvdW5kLXNpemU6IDQwcHggMThweDsKICAgICAgYmFja2dyb3VuZC1wb3NpdGlvbjogY2VudGVyOwogICAgICBkaXNwbGF5OiBibG9jazsKICB9CiAgCiAgI2ZvbnQtdHlwZS1idXR0b25zLAogIC5zZWdtZW50ZWQtYnV0dG9uIHsKICAgICAgZGlzcGxheTogZmxleDsKICAgICAgZmxleC1kaXJlY3Rpb246IHJvdzsKICAgICAgbGlzdC1zdHlsZTogbm9uZTsKICAgICAgcGFkZGluZzogMTBweCA1cHg7CiAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7CiAgfQogIAogICNmb250LXR5cGUtYnV0dG9ucyA+IGxpLAogIC5zZWdtZW50ZWQtYnV0dG9uID4gbGkgewogICAgICB3aWR0aDogNTBweDsgLyogY29tYmluZWQgd2l0aCBmbGV4LCB0aGlzIGFjdHMgYXMgYSBtaW5pbXVtIHdpZHRoICovCiAgICAgIGZsZXg6IDEgMCBhdXRvOwogICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7CiAgICAgIGxpbmUtaGVpZ2h0OiAyMHB4OwogIH0KICAKICAjZm9udC10eXBlLWJ1dHRvbnMgPiBsaSB7CiAgICAgIHBhZGRpbmc6IDEwcHggMDsKICB9CiAgCiAgLnNlZ21lbnRlZC1idXR0b24gPiBsaSB7CiAgICAgIGJvcmRlci1sZWZ0OiAxcHggc29saWQgI0I1QjVCNTsKICB9CiAgCiAgLnNlZ21lbnRlZC1idXR0b24gPiBsaTpmaXJzdC1jaGlsZCB7CiAgICAgIGJvcmRlci1sZWZ0OiAwcHg7CiAgfQogIAogICNmb250LXR5cGUtYnV0dG9ucyA+IGxpID4gYSwKICAuc2VnbWVudGVkLWJ1dHRvbiA+IGxpID4gYSB7CiAgICAgIHZlcnRpY2FsLWFsaWduOiBtaWRkbGU7CiAgICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTsKICAgICAgY29sb3I6IGJsYWNrOwogIH0KICAKICAjZm9udC10eXBlLWJ1dHRvbnMgPiBsaSA+IGEgewogICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7CiAgICAgIGZvbnQtc2l6ZTogNDhweDsKICAgICAgbGluZS1oZWlnaHQ6IDUwcHg7CiAgICAgIG1hcmdpbi1ib3R0b206IDVweDsKICAgICAgYm9yZGVyLWJvdHRvbTogM3B4IHNvbGlkIHRyYW5zcGFyZW50OwogIH0KICAKICAuc2VnbWVudGVkLWJ1dHRvbiA+IGxpID4gYSB7CiAgICAgIGRpc3BsYXk6IGJsb2NrOwogICAgICBwYWRkaW5nOiA1cHggMDsKICAgICAgZm9udC1mYW1pbHk6ICJWZXJkYW5hIixzYW5zLXNlcmlmOwogICAgICBmb250LXdlaWdodDogbGlnaHRlcjsKICB9CiAgCiAgI2ZvbnQtdHlwZS1idXR0b25zID4gbGkgPiBhOmFjdGl2ZSwKICAjZm9udC10eXBlLWJ1dHRvbnMgPiBsaS5zZWxlY3RlZCA+IGEgewogICAgICBib3JkZXItY29sb3I6ICNmZjk0MDA7CiAgfQogIAogIC5zZWdtZW50ZWQtYnV0dG9uID4gbGkgPiBhOmFjdGl2ZSwKICAuc2VnbWVudGVkLWJ1dHRvbiA+IGxpLnNlbGVjdGVkID4gYSB7CiAgICAgIGZvbnQtd2VpZ2h0OiBib2xkOwogIH0KICAKICAjZm9udC10eXBlLWJ1dHRvbnMgPiBsaSA+IC5zYW5zLXNlcmlmIHsKICAgICAgZm9udC13ZWlnaHQ6IGxpZ2h0ZXI7CiAgfQogIAogICNmb250LXR5cGUtYnV0dG9ucyA+IGxpID4gZGl2IHsKICAgICAgY29sb3I6ICM2NjY7CiAgICAgIGZvbnQtc2l6ZTogMTJweDsKICB9CiAgCiAgLnRvZ2dsZS1idXR0b24ub24gewogICAgICBiYWNrZ3JvdW5kLWltYWdlOiB1cmwoJ2Nocm9tZTovL2Jyb3dzZXIvc2tpbi9pbWFnZXMvcmVhZGVyLXRvZ2dsZS1vbi1pY29uLW1kcGkucG5nJyk7CiAgfQogIAogIC50b2dnbGUtYnV0dG9uIHsKICAgICAgYmFja2dyb3VuZC1pbWFnZTogdXJsKCdjaHJvbWU6Ly9icm93c2VyL3NraW4vaW1hZ2VzL3JlYWRlci10b2dnbGUtb2ZmLWljb24tbWRwaS5wbmcnKTsKICB9CiAgCiAgLnNoYXJlLWJ1dHRvbiB7CiAgICAgIGJhY2tncm91bmQtaW1hZ2U6IHVybCgnY2hyb21lOi8vYnJvd3Nlci9za2luL2ltYWdlcy9yZWFkZXItc2hhcmUtaWNvbi1tZHBpLnBuZycpOwogIH0KICAKICAuc3R5bGUtYnV0dG9uIHsKICAgICAgYmFja2dyb3VuZC1pbWFnZTogdXJsKCdjaHJvbWU6Ly9icm93c2VyL3NraW4vaW1hZ2VzL3JlYWRlci1zdHlsZS1pY29uLW1kcGkucG5nJyk7CiAgfQogIDwvc3R5bGU+CjwvaGVhZD4KCjxib2R5PgogIDxkaXYgaWQ9InJlYWRlci1oZWFkZXIiIGNsYXNzPSJoZWFkZXIiPgogICAgPGEgaWQ9InJlYWRlci1kb21haW4iIGNsYXNzPSJkb21haW4iIGhyZWY9IiVSRUFERVItVVJMJSI+JVJFQURFUi1ET01BSU4lPC9hPgogICAgPGRpdiBjbGFzcz0iZG9tYWluLWJvcmRlciI+PC9kaXY+CiAgICA8aDEgaWQ9InJlYWRlci10aXRsZSI+JVJFQURFUi1USVRMRSU8L2gxPgogICAgPGRpdiBpZD0icmVhZGVyLWNyZWRpdHMiIGNsYXNzPSJjcmVkaXRzIj48L2Rpdj4KICA8L2Rpdj4KCiAgPGRpdiBpZD0icmVhZGVyLWNvbnRlbnQiIGNsYXNzPSJjb250ZW50Ij4KICAgICAgJVJFQURFUi1DT05URU5UJQogIDwvZGl2PgoKICA8ZGl2IGlkPSJyZWFkZXItbWVzc2FnZSIgY2xhc3M9Im1lc3NhZ2UiPgogICAgICAlUkVBREVSLU1FU1NBR0UlCiAgPC9kaXY+CgogIDx1bCBpZD0icmVhZGVyLXRvb2xiYXIiIGNsYXNzPSJ0b29sYmFyIHRvb2xiYXItaGlkZGVuIj4KICAgIDxsaT48YSBpZD0ic2hhcmUtYnV0dG9uIiBjbGFzcz0iYnV0dG9uIHNoYXJlLWJ1dHRvbiIgaHJlZj0iIyI+PC9hPjwvbGk+CiAgICA8dWwgY2xhc3M9ImRyb3Bkb3duIj4KICAgICAgPGxpPjxhIGNsYXNzPSJkcm9wZG93bi10b2dnbGUgYnV0dG9uIHN0eWxlLWJ1dHRvbiIgaHJlZj0iIyI+PC9hPjwvbGk+CiAgICAgIDxsaSBjbGFzcz0iZHJvcGRvd24tcG9wdXAiPgogICAgICAgIDx1bCBpZD0iZm9udC10eXBlLWJ1dHRvbnMiPjwvdWw+CiAgICAgICAgPGhyPjwvaHI+CiAgICAgICAgPHVsIGlkPSJmb250LXNpemUtYnV0dG9ucyIgY2xhc3M9InNlZ21lbnRlZC1idXR0b24iPjwvdWw+CiAgICAgICAgPGhyPjwvaHI+CiAgICAgICAgPHVsIGlkPSJjb2xvci1zY2hlbWUtYnV0dG9ucyIgY2xhc3M9InNlZ21lbnRlZC1idXR0b24iPjwvdWw+CiAgICAgIDwvbGk+CiAgICA8L3VsPgogICAgPGxpPjxhIGlkPSJ0b2dnbGUtYnV0dG9uIiBjbGFzcz0iYnV0dG9uIHRvZ2dsZS1idXR0b24iIGhyZWY9IiMiPjwvYT48L2xpPgogIDwvdWw+Cgo8L2JvZHk+Cgo8L2h0bWw+Cgo=";
    return window.atob(s);
}

mozCheckReadability();


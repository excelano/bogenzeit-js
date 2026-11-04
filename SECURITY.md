# Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately through GitHub Security Advisories at https://github.com/excelano/bogenzeit-js/security/advisories/new. If you would rather not use GitHub, email david.anderson@excelano.com instead. I aim to respond within seven days.

Please do not open public issues for security problems.

## Supported versions

The latest release receives security fixes. Older versions are not supported.

## What bogenzeit-js can access

bogenzeit-js is a library, not a service, and has no dependencies. `at`, `events`, `format`, and `glyphSvg` are pure computation over the latitude, longitude, and date you pass them; they touch no network, no storage, and no filesystem, and run no subprocesses. `mount` additionally writes the formatted reading into the one DOM element you give it and sets a timer to refresh it; it reads nothing else from the page.

The library never requests the visitor's location and never opens a network connection. If a page wants the viewer's own coordinates it calls the Geolocation API itself and passes the result in — that prompt and that permission belong to the page, not to this library.

## What bogenzeit-js stores

Nothing. No cookies, no local storage, no telemetry, no analytics, no remote logging. Its only output is the value returned from `at`, `events`, or `format`, and, for `mount`, the text written into the element you supply.

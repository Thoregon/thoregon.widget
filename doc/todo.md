ToDo
====

- script to embedd 
    - scan `<*-widget-*>` tags
    - handle document mutations
    - lookup repo mapping
- define Repo mappings for widget names
    - html-tag -> thoregon widget uri
    - simple js file
        - for every namespace (e.g. thatsme), tag must start with namespace `<thatsme-widget-*>`
        - maintain while deploy a package with a widget to ammandul (repo) within a namespace
    - load custom element for hatch
- standard hatches w/o own class
    - create custom element from repo entries 
        - register tag
        - use iframe src

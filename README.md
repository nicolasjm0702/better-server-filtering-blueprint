# Better Server Filtering

Replaces the Pterodactyl admin dashboard's your/others toggle with an
all-servers view, a filter select (All / Mine / Others / Specific user),
and a sort select (online+name, name, created, updated).

## Installation

1. Drop `betterserverfiltering.blueprint` into your Pterodactyl root folder
   (usually `/var/www/pterodactyl/`).
2. Run:

   ```bash
   blueprint -i betterserverfiltering
   ```

## Removal

```bash
blueprint -r betterserverfiltering
```

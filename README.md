# Better Server Filtering

Replaces the Pterodactyl admin dashboard's your/others toggle with an
all-servers view, a filter select (All / Mine / Others / Specific user),
and a sort select (online+name, name, created, updated).

<img width="1589" height="261" alt="image" src="https://github.com/user-attachments/assets/46db49e6-5fc2-475f-a0a6-38f1e536e3bd" />

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

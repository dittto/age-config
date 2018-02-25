# AGE Config

This reads `_helper.yaml` files in the AGE plugins and generates a json file from them in `./data/age-config.json`. This json file can then be imported into the Alexa setup process.

## How to use

Add this plugin to your AGE install using `npm install age-config`.

Run the following command to generate the file from your AGE install: 

```bash
serverless age-config
```

You'll need to add the following to `src/config/config.yaml`:

```yaml
config:
    invocation_name: age test
``` 

This will pull any settings from all `_helper.yaml` files in plugins and from `src/config`. You'll need to create the `src/config/_helper.yaml` file if you don't have one, to describe what slots (types) have what values:

For example:

```yaml
slot_values:
    command:
        - jester
        - yes
        - no
    credit:
        - Nick Stacey
    item:
        - brass key
    object:
        - door
        - west door
        - south door
        - north door
        - switch
```

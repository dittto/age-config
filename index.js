'use strict';

class AgeConfigPlugin {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;

        this.commands = {
            "age-config": {
                usage: 'Builds the config required for AGE based on the plugins supplied',
                lifecycleEvents: [
                    'getConfig'
                ],
            },
        };

        this.hooks = {
            'age-config:getConfig': this.getConfig.bind(this),
        };
    }

    getConfig() {
        const yaml = require('yamljs'),
            fs = require('fs'),
            merge = require('deepmerge'),
            AGE = require('../../AGE'),
            config = new AGE.Config('./config/');
        let configData = {};

        const pluginPaths = new AGE.Plugins(config).getPluginPaths();
        pluginPaths.forEach((path) => {
            try {
                configData = merge(yaml.load('./AGE/Plugin/' + path + '/_helper.yaml'), configData);
            } catch (e) {
                this.serverless.cli.log('AGE config helper: Failed to find / load helper for "' + path + '/_helper.yaml' + '"');
            }
        });

        configData = merge({slot_values: config.get('slot_values')}, configData);

        const data = {
            'languageModel': {
                'invocationName': config.getBaseConfig('invocation_name'),
                'intents': this.__buildIntents(configData),
                'types': this.__buildTypes(configData)
            }
        };

        fs.writeFile('../data/age-config.json', JSON.stringify(data, null, 4), err => {
            if (err) {
                throw err;
            }
            this.serverless.cli.log('AGE config helper: Created data/age-config.json file');
        });
    }

    __buildIntents(configData) {
        const intents = [
            {
                name: 'AMAZON.CancelIntent',
                slots: [],
                samples: []
            },
            {
                name: 'AMAZON.HelpIntent',
                slots: [],
                samples: []
            },
            {
                name: 'AMAZON.StopIntent',
                slots: [],
                samples: []
            }
        ];

        Object.keys(configData.intents).forEach(intent => {
            const slots = configData.intents[intent];
            const slotData = [];
            Object.keys(slots).forEach(slotName => {
                slotData.push({
                    name: slotName,
                    type: slots[slotName]
                });
            });

            intents.push({
                name: intent,
                slots: slotData,
                samples: configData.utterances[intent] || []
            });
        });

        return intents;
    }

    __buildTypes(configData) {
        const types = [];

        Object.keys(configData.slot_values).forEach(type => {
            const data = {
                name: type,
                values: []
            };

            const values = configData.slot_values[type];
            values.forEach(value => {
                data.values.push({
                    id: '',
                    name: {
                        value: value,
                        synonyms: []
                    }
                });
            });

            types.push(data);
        });

        Object.keys(configData.slots).forEach(type => {
            const data = {
                name: type,
                values: []
            };

            const otherTypes = configData.slots[type];
            otherTypes.forEach(otherType => {
                const values = configData.slot_values[otherType];
                values.forEach(value => {
                    data.values.push({
                        id: '',
                        name: {
                            value: value,
                            synonyms: []
                        }
                    });
                });
            });

            types.push(data);
        });

        return types;
    }
}

module.exports = AgeConfigPlugin;

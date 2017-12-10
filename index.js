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

        const intents = this.__buildIntents(configData);
        fs.writeFile('../data/intents.json', JSON.stringify(intents, null, 4), err => {
            if (err) {
                throw err;
            }
            this.serverless.cli.log('AGE config helper: Created data/intents.json file');
        });

        const utterances = this.__buildSampleUtterances(configData);
        fs.writeFile('../data/SampleUtterances.txt', utterances.join("\n"), err => {
            if (err) {
                throw err;
            }
            this.serverless.cli.log('AGE config helper: Created data/SampleUtterances.txt file');
        });

        const slotValues = this.__buildSlotValues(configData);
        fs.writeFile('../data/SlotValues.txt', slotValues.join("\n"), err => {
            if (err) {
                throw err;
            }
            this.serverless.cli.log('AGE config helper: Created data/SlotValues.txt file');
        });
    }

    __buildIntents(configData) {
        const intents = [];

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
                intent: intent,
                slots: slotData
            });
        });

        return {'intents': intents};
    }

    __buildSampleUtterances(configData) {
        const utterances = [];

        Object.keys(configData.utterances).forEach(intent => {
            const texts = configData.utterances[intent];
            texts.forEach(text => {
                utterances.push(intent + " " + text);
            });
        });

        return utterances;
    }

    __buildSlotValues(configData) {
        const slotValues = [];

        Object.keys(configData.slot_values).forEach(type => {
            slotValues.push('[' + type + ']');

            const values = configData.slot_values[type];
            values.forEach(value => {
                slotValues.push(value);
            });

            slotValues.push('');
        });

        Object.keys(configData.slots).forEach(type => {
            slotValues.push('[' + type + ']');

            const otherTypes = configData.slots[type];
            otherTypes.forEach(otherType => {
                const values = configData.slot_values[otherType];
                values.forEach(value => {
                    slotValues.push(value);
                });
            });

            slotValues.push('');
        });

        return slotValues;
    }
}

module.exports = AgeConfigPlugin;

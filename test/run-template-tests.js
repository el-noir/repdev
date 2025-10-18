import { loadTemplate } from '../src/core/TemplateManager.js';
import { startContainers } from '../src/core/dockerManger.js';
import fs from 'fs';
import path from 'path';

(async function(){
    try {
        console.log('Running template validation test...');
        const config = loadTemplate(new URL('../src/templates/node_template.yml', import.meta.url));
        console.log('Template validation passed.');

        console.log('Running dry-run startContainers test...');
        // Call startContainers with dryRun to ensure no Docker contact is attempted
        await startContainers(config, { force: false, dryRun: true });
        console.log('startContainers dry-run passed.');

                console.log('Running hook and readiness schema test...');
                const tmpYamlPath = path.join(process.cwd(), 'test', 'tmp-repdev.yml');
                const yaml = `version: '1.0'
hooks:
    preUp:
        - echo "preUp"
    postUp:
        - echo "postUp"
services:
    demo:
        image: node:20
        container_name: demo_c
        wait_for:
            type: http
            url: http://localhost:9/health
            timeout: 1000
            interval: 200
        hooks:
            beforeStart:
                - echo "beforeStart"
            afterStart:
                - echo "afterStart"
`; 
                fs.writeFileSync(tmpYamlPath, yaml, 'utf8');
                const cfg2 = loadTemplate(tmpYamlPath);
                console.log('Extended schema validation passed.');
                await startContainers(cfg2, { force: false, dryRun: true });
                console.log('Hooks/readiness dry-run path executed.');

                console.log('All tests passed.');
        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err.message);
        process.exit(1);
    }
})();

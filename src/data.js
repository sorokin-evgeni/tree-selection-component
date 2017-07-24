import 'whatwg-fetch';
import Promise from 'promise-polyfill';
window.Promise = Promise;
let projectsCache;

export default {

    getProjectsAsync() {
        if (projectsCache) {
            return Promise.resolve(projectsCache);
        }

        return fetch('/api/project/list').then(function(response) {
            return response.json();
        }).then(sourceRawData => {

            let rawData = sourceRawData.project.filter(item => !item.parentProject);
            for (let i = 0; i < 10; i++) {
                sourceRawData.project.forEach(item => {
                    if (!item.parentProject) return;
                    let postfix = i ? `#${i}` : '';
                    rawData.push({
                        ...item,
                        id: item.id + postfix,
                        name: item.name + postfix,
                        parentProject: {
                            id: item.parentProject.id === '_Root' ? item.parentProject.id : item.parentProject.id + postfix
                        }
                    });
                });
            }
            projectsCache = rawData;

            return projectsCache;
        }).catch(err => {
            setTimeout(function() {
                throw err;
            });
        });
    }

}
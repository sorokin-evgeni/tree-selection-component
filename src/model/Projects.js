import 'whatwg-fetch';
import Promise from 'promise-polyfill';
let projectsCache;

export default {

    getProjectsAsync() {
        if (projectsCache) {
            return Promise.resolve(projectsCache);
        }

        return window.fetch('/api/project/list').then((response) => {
            return response.json();
        })
            .then(sourceRawData => {
                const rawData = sourceRawData.project.filter(item => !item.parentProject);

                for (let i = 0; i < 1; i++) {
                    sourceRawData.project.forEach(item => {
                        if (!item.parentProject) return;
                        const postfix = i ? `#${i}` : '';

                        rawData.push({
                            ...item,
                            id: item.id + postfix,
                            name: item.name + postfix,
                            parentProject: {
                                id: item.parentProject.id === '_Root'
                                    ? item.parentProject.id
                                    : item.parentProject.id + postfix
                            }
                        });
                    });
                }
                projectsCache = rawData;

                return projectsCache;
            })
            .catch(err => {
                setTimeout(() => {
                    throw err;
                });
            });
    },

    save(selectedItemsIds) {
        window.localStorage.setItem('selectedProjects', JSON.stringify(selectedItemsIds));

        return Promise.resolve();
    },

    fetch() {
        return Promise.resolve(JSON.parse(window.localStorage.getItem('selectedProjects')));
    }

};

/**
 * All static methods
 */

import Benchmark from '../utils/Benchmark';

const NAME_SEPARATOR = '::';

function deepClone(object) {
    return JSON.parse(JSON.stringify(object));
}

function getNode(nodeId, hash) {
    if (!hash[nodeId]) {
        throw new Error(`Node with id=${nodeId} was not found.`);
    }

    return hash[nodeId];
}

function getItemForArray(id, hash, {level = 0, name, isGhost = false} = {}) {
    const item = getNode(id, hash);
    const {isHidden, hasHiddenChildren} = item;

    return { id,
        isHidden,
        hasHiddenChildren,
        name: name || item.name,
        level,
        isGhost};
}

function findVisibleParent(id, hash) {
    const item = getNode(id, hash);

    if (!item.parentId) return null;
    const parent = getNode(item.parentId, hash);

    return parent.isHidden ? findVisibleParent(parent.id, hash) : parent;
}

function getParents(itemId, hash) {
    const node = getNode(itemId, hash);

    if (!node.parentId) return [];
    const parentNode = getNode(node.parentId, hash);

    return [parentNode, ...getParents(parentNode.id, hash)];
}

function match(query, name) {
    const updatedQuery = [...query];

    let lowercaseName = name.toLowerCase();

    for (let i = 0; i < query.length; i++) {
        const queryStr = query[i];

        if (lowercaseName.indexOf(queryStr) === -1) {
            break;
        }
        updatedQuery.shift();
        lowercaseName = lowercaseName.replace(queryStr, '');
    }

    return updatedQuery;
}

function forEachChildren(itemId, hash, callback, {includeSelf = true} = {}) {
    const node = getNode(itemId, hash);

    node.children && node.children.forEach(itemId => {
        forEachChildren(itemId, hash, callback, {includeSelf: true});
    });
    includeSelf && callback(node);
}

function _getVisibleItems(rootIds, hash, level = 1) {
    let result = [];

    for (let i = 0; i < rootIds.length; i++) {
        const id = rootIds[i].id;
        let childLevel = level;

        if (hash[id].isHidden) {
            throw new Error('_getVisibleItems: all items in sortedChildren have to be visible.');
        } else {
            result.push(getItemForArray(id, hash, {name: rootIds[i].name,
                level}));
            childLevel++;
        }
        result = result.concat(
            _getVisibleItems(
                hash[id].sortedChildren,
                hash,
                childLevel
            )
        );
    }

    return result;
}

function isInFilter(query, id, hash) {
    if (!query || !query.length) return true;

    for (let i = 0; i < hash[id].children.length; i++) {
        const childId = hash[id].children[i];

        if (!hash[childId].isHidden && !hash[childId].hasHiddenChildren) {
            continue;
        }

        const updatedQuery = match(query, hash[childId].name);

        if (isInFilter(updatedQuery, childId, hash)) {
            return true;
        }
    }

    return false;
}

function _getHiddenItems(rootIds, hash, {level = 0, query = null}) {
    let result = [];

    for (let i = 0; i < rootIds.length; i++) {
        const id = rootIds[i];
        let updatedQuery = null;

        if (!hash[id].isHidden && !hash[id].hasHiddenChildren) {
            continue;
        }
        if (query && query.length) {
            updatedQuery = match(query, hash[id].name);
            if (!isInFilter(updatedQuery, id, hash)) {
                continue;
            }
        }

        result.push(getItemForArray(id, hash, {level,
            isGhost: !hash[id].isHidden}));
        result = result.concat(
            _getHiddenItems(
                hash[id].children,
                hash,
                {
                    level: level + 1,
                    query: updatedQuery
                }
            )
        );
    }

    return result;
}

function _getVisibleItemIds(rootIds, hash) {
    let result = [];

    rootIds.forEach(id => {
        if (hash[id].isHidden) return;
        result.push(hash[id].id);
        if (!hash[id].sortedChildren || !hash[id].sortedChildren.length) return;
        result = result.concat(_getVisibleItemIds(hash[id].sortedChildren.map(item => item.id), hash));
    });

    return result;
}

function calcHasHiddenChildren(parent, hash) {
    return parent.children.reduce((hasHiddenChildren, itemId) => {
        const item = getNode(itemId, hash);


        return hasHiddenChildren || item.isHidden || item.hasHiddenChildren;
    }, false);
}

function updateSortedChildren(itemId, hash) {
    let visibleParentFound = false;
    let namePrefix = '';

    getParents(itemId, hash).forEach(parent => {
        if (visibleParentFound) return;

        if (parent.isHidden) {
            namePrefix = parent.name + NAME_SEPARATOR + namePrefix;

            return;
        }

        visibleParentFound = true;
        !parent.sortedChildren && (parent.sortedChildren = []);
        parent.sortedChildren.push({
            id: itemId,
            name: namePrefix + hash[itemId].name
        });
    });
}

function removeDuplicates(itemId, hash) {
    let visibleParentFound = false;

    getParents(itemId, hash).forEach(parent => {
        if (visibleParentFound || parent.isHidden) return;

        visibleParentFound = true;

        if (parent.sortedChildren.length === 1 || hash[itemId].children.length === 0) return;
        for (let i = 0; i < parent.sortedChildren.length; i++) {
            const siblingItemParents = getParents(parent.sortedChildren[i].id, hash);
            const parentIndex = siblingItemParents.findIndex(parent => parent.id === itemId);

            if (parentIndex === -1) {
                continue;
            }
            parent.sortedChildren.splice(i, 1);
            i--;
        }
    });
}

const Tree = {

    constructHash(rawData) {
        Benchmark.start('constructHash');
        const hash = {};

        const skippedChildren = [];

        for (let i = 0; i < rawData.length; i++) {
            const project = rawData[i];
            const parentId = project.parentProject ? project.parentProject.id : null;

            hash[project.id] = {
                name: project.name,
                id: project.id,
                isHidden: true,
                hasHiddenChildren: true,
                children: [],
                sortedChildren: [],
                parentId
            };
            if (!parentId) {
                hash[project.id].isHidden = false;
                continue;
            }
            if (hash[parentId]) {
                hash[parentId].children.push(project.id);
            } else {
                skippedChildren.push(project.id);
            }
        }

        skippedChildren.forEach(id => {
            hash[hash[id].parentId].children.push(id);
        });

        Benchmark.stop('constructHash');

        return hash;
    },

    setVisibleItems(rootIds, hash, visibleItemsIds) {
        if (!visibleItemsIds.length) return hash;

        // set is hidden
        visibleItemsIds.forEach(id => {
            hash[id].isHidden = false;
        });

        // update hasHiddenChildren for all items in tree
        rootIds.forEach(id => {
            forEachChildren(id, hash, item => {
                item.hasHiddenChildren = calcHasHiddenChildren(item, hash);
            });
        });

        visibleItemsIds.forEach(itemId => {
            updateSortedChildren(itemId, hash);
        });

        return hash;
    },

    getRootIds(rawData) {
        return rawData.filter(item => {
            return !item.parentProject || !item.parentProject.id;
        }).map(item => item.id);
    },

    setHidden(itemId, srcHash) {
        const hash = deepClone(srcHash);

        Benchmark.start('setHidden');

        forEachChildren(itemId, hash, item => {
            item.isHidden = true;
            item.hasHiddenChildren = true;
        });

        let visibleParentFound = false;

        getParents(itemId, hash).forEach(parent => {
            parent.hasHiddenChildren = true;
            if (visibleParentFound || parent.isHidden) return;
            visibleParentFound = true;
            if (!parent.sortedChildren) return;
            const itemIndex = parent.sortedChildren.findIndex(item => item.id === itemId);

            parent.sortedChildren.splice(itemIndex, 1);
        });

        Benchmark.stop('setHidden');

        return hash;
    },

    setVisible(itemId, srcHash, {recursive = true, clone = true} = {}) {
        const hash = clone ? deepClone(srcHash) : srcHash;

        Benchmark.start('setVisible');

        recursive && forEachChildren(itemId, hash, item => {
            item.isHidden = false;
            item.hasHiddenChildren = false;

            // it may be optimized:
            item.sortedChildren = item.children.map(id => {
                return {
                    id,
                    name: hash[id].name
                };
            });
        });

        getParents(itemId, hash).forEach(parent => {
            parent.hasHiddenChildren = calcHasHiddenChildren(parent, hash);
        });

        updateSortedChildren(itemId, hash);
        removeDuplicates(itemId, hash);

        Benchmark.stop('setVisible');

        return hash;
    },

    swap(itemAId, itemBId, srcHash) {
        const hash = deepClone(srcHash);

        Benchmark.start('swap');

        const itemANode = getNode(itemAId, hash);

        if (!itemANode.parentId) {
            throw new Error(`Tree.swap: should swap only child nodes. "${itemAId}" is root node`);
        }

        const parentNode = getNode(itemANode.parentId, hash);
        const aIndex = parentNode.sortedChildren.indexOf(itemAId);

        if (aIndex === -1) {
            throw new Error(
                `Tree.swap: invalid data structure. "${itemAId}" has parent "${itemANode.parentId}", but it is not found as parent's child.`
            );
        }
        parentNode.sortedChildren.splice(aIndex, 1);

        const bIndex = parentNode.sortedChildren.indexOf(itemBId);

        if (bIndex === -1) {
            throw new Error(`Tree.swap: "${itemAId}" and "${itemBId}" has different parents.`);
        }
        parentNode.sortedChildren.splice(bIndex + (aIndex > bIndex ? 0 : 1), 0, itemAId);

        Benchmark.stop('swap');

        return hash;
    },

    move(itemId, direction, srcHash) {
        Benchmark.start('move');
        const hash = deepClone(srcHash);
        const visibleParent = findVisibleParent(itemId, hash);

        if (!visibleParent) {
            return null;
        }
        if (!visibleParent.sortedChildren || !visibleParent.sortedChildren.length) {
            console.warn('visibleParent', visibleParent);
            throw new Error('Tree.move: data structure is broken. sortedChildren is not exists or empty.');
        }

        const itemIndex = visibleParent.sortedChildren.findIndex(item => item.id === itemId);

        if (itemIndex === -1) {
            console.warn(itemId, visibleParent, hash);
            throw new Error('Tree.move: data structure is broken.');
        }

        if (
            itemIndex === 0 && direction === 'up' ||
            itemIndex === visibleParent.sortedChildren.length - 1 && direction === 'down'
        ) return null;

        const newItemIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
        const item = visibleParent.sortedChildren[itemIndex];

        visibleParent.sortedChildren[itemIndex] = visibleParent.sortedChildren[newItemIndex];
        visibleParent.sortedChildren[newItemIndex] = item;

        Benchmark.stop('move');

        return hash;
    },

    getVisibleItems(rootIds, hash) {
        Benchmark.start('getVisibleItems');
        const sortedChildren = rootIds.reduce((collector, id) => {
            return collector.concat(hash[id].sortedChildren || []);
        }, []);

        const visibleItems =
            rootIds
                .map(id => getItemForArray(id, hash))
                .concat(_getVisibleItems(sortedChildren, hash));

        Benchmark.stop('getVisibleItems');

        return visibleItems;
    },

    getVisibleItemsIds(rootIds, hash) {
        Benchmark.start('getVisibleItemsIds');
        const visibleItemsIds = _getVisibleItemIds(rootIds, hash);

        Benchmark.stop('getVisibleItemsIds');

        return visibleItemsIds;
    },

    getHiddenItems(rootIds, hash, options = {}) {
        Benchmark.start('getHiddenItems');
        const children = rootIds.reduce((collector, id) => {
            return collector.concat(hash[id].children || []);
        }, []);

        const hiddenItems = _getHiddenItems(children, hash, options);

        Benchmark.stop('getHiddenItems');

        return hiddenItems;
    }

};

export default Tree;

import Tree from './Tree';
import {expect} from 'chai';

describe('Tree operations', function() {

    let hash;

    beforeEach(function() {

        hash = {
            root: {
                id: 'root',
                name: 'root',
                parentId: null,
                children: ['root_1', 'root_2', 'root_3']
            },
            root_1: {
                id: 'root_1',
                name: 'root_1',
                parentId: 'root',
                children: ['root_1_1', 'root_1_2', 'root_1_3']
            },
            root_2: {
                id: 'root_2',
                name: 'root_2',
                parentId: 'root',
                children: []
            },
            root_3: {
                id: 'root_3',
                name: 'root_3',
                parentId: 'root',
                children: []
            },
            root_1_1: {
                id: 'root_1_1',
                name: 'root_1_1',
                parentId: 'root_1',
                children: ['root_1_1_1', 'root_1_1_2', 'root_1_1_3']
            },
            root_1_2: {
                id: 'root_1_2',
                name: 'root_1_2',
                parentId: 'root_1',
                children: []
            },
            root_1_3: {
                id: 'root_1_3',
                name: 'root_1_3',
                parentId: 'root_1',
                children: []
            },
            root_1_1_1: {
                id: 'root_1_1_1',
                name: 'root_1_1_1',
                parentId: 'root_1_1',
                children: []
            },
            root_1_1_2: {
                id: 'root_1_1_2',
                name: 'root_1_1_2',
                parentId: 'root_1_1',
                children: []
            },
            root_1_1_3: {
                id: 'root_1_1_3',
                name: 'root_1_1_3',
                parentId: 'root_1_1',
                children: []
            }
        };
    });

    describe('Test constructHash function', function() {

        it('should add items to hash', function() {

            const rawData = [{
                "id": "_Root",
                "name": "Root project",
                "buildTypes": {
                    "count": 0,
                    "buildType": []
                }
            }];

            hash = Tree.constructHash(rawData);

            expect(hash['_Root'] !== undefined).to.be.true;
        });

        it('should set isHidden = true by default for no root items', function() {
            const rawData = [{
                "id": "_Root",
                "name": "Root project",
                "buildTypes": {
                    "count": 0,
                    "buildType": []
                }
            }, {
                "id": "OpenSourceProjects",
                "name": "OpenSourceProjects",
                "parentProject": {
                    "id": "_Root"
                }
            }];

            hash = Tree.constructHash(rawData);

            expect(hash['OpenSourceProjects'].isHidden).to.be.true;
        });

        it('should set parentId', function() {
            const item = {
                "id": "OpenSourceProjects",
                "name": "Open-source projects",
                "parentProject": {
                    "id": "_Root"
                },
                "buildTypes": {
                    "count": 0,
                    "buildType": []
                }
            };

            hash = Tree.constructHash([item, {
                "id": "_Root",
                "name": "Root project",
                "buildTypes": {
                    "count": 0,
                    "buildType": []
                }
            }]);

            expect(hash['OpenSourceProjects'].parentId).to.equal('_Root');
        });

        it('should calculate children', function() {
            const rawData = [{
                "id": "_Root",
                "name": "Root"
            }, {
                "id": "OpenSourceProjects",
                "name": "Open-source projects",
                "parentProject": {
                    "id": "_Root"
                }
            }, {
                "id": "ApacheAnt",
                "name": "Apache Ant",
                "parentProject": {
                    "id": "OpenSourceProjects"
                }
            }, {
                "id": "ApacheAnt2",
                "name": "Apache Ant",
                "parentProject": {
                    "id": "OpenSourceProjects"
                }
            }];

            hash = Tree.constructHash(rawData);

            const result = ['ApacheAnt', 'ApacheAnt2'];

            expect(hash['OpenSourceProjects'].children).to.eql(result);
        });

    });

    describe('Test getRootIds function', function() {

        it('should find projects with empty parent', function() {

            const rawData = [{
                "id": "_Root"
            }, {
                "id": "OpenSourceProjects",
                "parentProject": {
                    "id": "_Root"
                }
            }, {
                "id": "__Root",
                "parentProject": {}
            }];

            expect(Tree.getRootIds(rawData)).to.eql(['_Root', '__Root']);

        });

    });

    describe('Test setHidden function', function() {

        it('should change isHidden to true', function() {

            hash = {
                root: {
                    isHidden: false
                }
            };

            expect(Tree.setHidden('root', hash)['root'].isHidden).to.be.true;
        });

        it('should change for all children isHidden to true', function() {

            hash = Tree.setHidden('root_1_1', hash);

            expect(hash['root_1_1_1'].isHidden && hash['root_1_1_2'].isHidden && hash['root_1_1_3'].isHidden).to.be.true;
        });

        it('should set hasHiddenChildren to true in all parents', function() {

            hash = Tree.setHidden('root_1_1', hash);

            expect(hash['root_1'].hasHiddenChildren && hash['root'].hasHiddenChildren).to.be.true;
        });

        it('should remove item from parent\'s sorted children', function() {

            hash['root_1'].sortedChildren = [{
                id: 'root_1_2'
            }, {
                id: 'root_1_1_1'
            }, {
                id: 'root_1_3'
            }];
            hash['root_1'].isHidden = false;
            hash['root_1_1'].isHidden = true;
            hash['root_1_1_1'].isHidden = false;

            hash = Tree.setHidden('root_1_1_1', hash);
            expect(hash['root_1'].sortedChildren.find(item => item.id === 'root_1_1_1')).to.be.undefined;
        })

    });

    describe('Test setVisible function', function() {

        it('should change isHidden to false', function() {

            hash = Tree.setVisible('root', hash);

            expect(hash['root'].isHidden).to.be.false;
        });

        it('should change for all children setVisible to false', function() {

            hash = Tree.setVisible('root_1_1', hash);

            expect(hash['root_1_1_1'].isHidden || hash['root_1_1_2'].isHidden || hash['root_1_1_3'].isHidden).to.be.false;
        });

        it('should update parent hasHiddenChildren to false if it has no visible children', function() {

            hash['root_1_1'].hasHiddenChildren = true;
            hash['root_1_1_1'].isHidden = true;
            hash['root_1_1_2'].isHidden = false;
            hash['root_1_1_2'].hasHiddenChildren = false;
            hash['root_1_1_3'].isHidden = false;
            hash['root_1_1_3'].hasHiddenChildren = false;

            hash = Tree.setVisible('root_1_1_1', hash);
            expect(hash['root_1_1'].hasHiddenChildren).to.be.false;
        });

        it('should skip update parent hasHiddenChildren if it has visible children', function() {

            hash['root_1_1'].hasHiddenChildren = true;
            hash['root_1_1_1'].isHidden = true;
            hash['root_1_1_2'].isHidden = false;
            hash['root_1_1_2'].hasHiddenChildren = false;
            hash['root_1_1_3'].isHidden = true;
            hash['root_1_1_3'].hasHiddenChildren = false;

            hash = Tree.setVisible('root_1_1_1', hash);
            expect(hash['root_1_1'].hasHiddenChildren).to.be.true;
        });

        it('should update self hasHiddenChildren to false', function() {

            hash['root_1_1'].hasHiddenChildren = true;
            hash['root_1_1_1'].isHidden = true;
            hash['root_1_1_2'].isHidden = false;
            hash['root_1_1_2'].hasHiddenChildren = false;
            hash['root_1_1_3'].isHidden = false;
            hash['root_1_1_3'].hasHiddenChildren = false;

            hash = Tree.setVisible('root_1_1_1', hash);
            expect(hash['root_1_1_1'].hasHiddenChildren).to.be.false;
        });

        it('should skip update parent hasHiddenChildren if it has children with hasHiddenChildren === true', function() {

            hash['root_1_1'].hasHiddenChildren = true;
            hash['root_1_1_1'].isHidden = true;
            hash['root_1_1_2'].isHidden = false;
            hash['root_1_1_2'].hasHiddenChildren = false;
            hash['root_1_1_3'].isHidden = false;
            hash['root_1_1_3'].hasHiddenChildren = true;

            hash = Tree.setVisible('root_1_1_1', hash);
            expect(hash['root_1_1'].hasHiddenChildren).to.be.true;
        });

        // sorted children:
        it('should clone children to sorted children', function() {

            hash = Tree.setVisible('root_1', hash);

            expect(hash['root_1'].sortedChildren).to.eql([{
                id: 'root_1_1',
                name: 'root_1_1'
            }, {
                id: 'root_1_2',
                name: 'root_1_2'
            }, {
                id: 'root_1_3',
                name: 'root_1_3'
            }]);

            expect(hash['root_1_1'].sortedChildren).to.eql([{
                id: 'root_1_1_1',
                name: 'root_1_1_1'
            }, {
                id: 'root_1_1_2',
                name: 'root_1_1_2'
            }, {
                id: 'root_1_1_3',
                name: 'root_1_1_3'
            }]);
        });

        it('should add new item to first visible parent\'s sorted children, when it is direct parent', function() {

            hash['root_1'].sortedChildren = [{
                id: 'root_1_2',
                name: 'root_1_2'
            }];
            hash['root_1'].isHidden = false;
            hash['root_1_1'].isHidden = true;

            hash = Tree.setVisible('root_1_1', hash);

            expect(hash['root_1'].sortedChildren[hash['root_1'].sortedChildren.length-1].id).to.equal('root_1_1');
        });

        it('should add new item to first visible parent\'s sorted children, when it is remote parent', function() {

            hash['root'].sortedChildren = [{
                id: 'root_1_2',
                name: 'root_1_2'
            }];
            hash['root'].isHidden = false;
            hash['root_1'].isHidden = true;
            hash['root_1_1'].isHidden = true;

            hash = Tree.setVisible('root_1_1', hash);

            expect(hash['root'].sortedChildren[hash['root'].sortedChildren.length-1].id).to.equal('root_1_1');
        });

        it('should copy name to sorted children when direct parent ', function() {
            hash['root_1'].sortedChildren = [{
                id: 'root_1_2',
                name: 'root_1_2'
            }];
            hash['root_1'].isHidden = false;
            hash['root_1_1'].isHidden = true;

            hash = Tree.setVisible('root_1_1', hash);

            expect(hash['root_1'].sortedChildren[hash['root_1'].sortedChildren.length-1].name).to.equal('root_1_1');
        });

        it('should generate right name when set visible to item with remote parent', function() {

            hash['root'].sortedChildren = [{
                id: 'root_1_2',
                name: 'root_1_2'
            }];
            hash['root'].isHidden = false;
            hash['root_1'].isHidden = true;
            hash['root_1_1'].isHidden = true;

            hash = Tree.setVisible('root_1_1', hash);

            expect(hash['root'].sortedChildren[hash['root'].sortedChildren.length-1].name).to.equal('root_1::root_1_1');
        });

        it('should update parent\'s sortedItems if new item contains some of them', function() {

            hash['root'].sortedChildren = [{
                id: 'root_1_1',
                name: 'root_1_1'
            }, {
                id: 'root_2',
                name: 'root_2'
            }, {
                id: 'root_1_3',
                name: 'root_1_3'
            }];
            hash['root_1'].isHidden = true;
            hash['root_1_1'].isHidden = false;

            hash = Tree.setVisible('root_1', hash);
            expect(hash['root'].sortedChildren).to.eql([{
                id: 'root_2',
                name: 'root_2'
            }, {
                id: 'root_1',
                name: 'root_1'
            }])
        })
    });

    describe('Test swap function', function() {

        it('should throw an error on attempt to swap nodes with different parents', function() {

            hash['root_1'].sortedChildren = ['root_1_1', 'root_1_2', 'root_1_3'];

            function swap() {
                Tree.swap('root_1_1', 'root_2_1', hash);
            }

            expect(swap).to.throw('different parents');
        });

        it('should correctly change sortedChildren', function() {

            hash['root_1'].sortedChildren = ['root_1_1', 'root_1_2', 'root_1_3'];

            hash = Tree.swap('root_1_1', 'root_1_3', hash);

            expect(hash['root_1'].sortedChildren).to.eql(['root_1_2', 'root_1_3', 'root_1_1']);
        });

        it('should correctly change sortedChildren when target index is higher', function() {

            hash['root_1'].sortedChildren = ['root_1_1', 'root_1_2', 'root_1_3'];

            hash = Tree.swap('root_1_3', 'root_1_1', hash);

            expect(hash['root_1'].sortedChildren).to.eql(['root_1_3', 'root_1_1', 'root_1_2']);
        });


    });

    describe('Test getVisibleItems', function() {

        it('should extract visible items', function() {

            hash = {
                root: {
                    id: 'root',
                    parentId: null,
                    isHidden: true,
                    hasHiddenChildren: true,
                    sortedChildren: [{id: 'root_2'}]
                },
                root_1: {
                    id: 'root_1',
                    parentId: 'root',
                    isHidden: true,
                    sortedChildren: []
                },
                root_2: {
                    id: 'root_2',
                    parentId: 'root',
                    isHidden: false,
                    sortedChildren: [{id: 'root_2_1'}]
                },
                root_2_1: {
                    id: 'root_2_1',
                    parentId: 'root_2',
                    isHidden: false,
                    sortedChildren: []
                }
            };


            const visibleItems = ['root', 'root_2', 'root_2_1'];

            expect(Tree.getVisibleItems(['root'], hash).map(item => item.id)).to.eql(visibleItems);
        });

        it('should calculate level for visible items', function() {

            hash = {
                root: {
                    id: 'root',
                    parentId: null,
                    isHidden: true,
                    hasHiddenChildren: true,
                    sortedChildren: [{id: 'root_2'}]
                },
                root_1: {
                    id: 'root_1',
                    parentId: 'root',
                    isHidden: true,
                    sortedChildren: []
                },
                root_2: {
                    id: 'root_2',
                    parentId: 'root',
                    isHidden: false,
                    sortedChildren: [{id: 'root_2_1'}]
                },
                root_2_1: {
                    id: 'root_2_1',
                    parentId: 'root_2',
                    isHidden: false,
                    sortedChildren: [{id: 'root_2_1_1'}]
                },
                root_2_1_1: {
                    id: 'root_2_1_1',
                    parentId: 'root_2_1',
                    isHidden: false,
                    sortedChildren: []
                }
            };

            const visibleItems = Tree.getVisibleItems(['root'], hash);

            expect([visibleItems[0].level, visibleItems[1].level]).to.eql([0, 1]);
        });

        it('should calculate level for visible items with siblings', function() {

            hash = {
                root: {
                    id: 'root',
                    parentId: null,
                    isHidden: true,
                    hasHiddenChildren: true,
                    sortedChildren: [{id: 'root_1'}, {id: 'root_2'}]
                },
                root_1: {
                    id: 'root_1',
                    parentId: 'root',
                    isHidden: false,
                    sortedChildren: []
                },
                root_2: {
                    id: 'root_2',
                    parentId: 'root',
                    isHidden: false,
                    sortedChildren: []
                }
            };

            const visibleItems = Tree.getVisibleItems(['root'], hash);

            expect([visibleItems[0].level, visibleItems[1].level, visibleItems[2].level]).to.eql([0, 1, 1]);
        });

        it('should get name from sorted children array', function() {

            hash = {
                root: {
                    id: 'root',
                    parentId: null,
                    isHidden: true,
                    hasHiddenChildren: true,
                    sortedChildren: [{ id: 'root_1_1', name: 'root_1::root_1_1' }]
                },
                root_1: {
                    id: 'root_1',
                    name: 'root_1',
                    parentId: 'root',
                    isHidden: true,
                    sortedChildren: []
                },
                root_1_1: {
                    id: 'root_1_1',
                    name: 'root_1_1',
                    parentId: 'root_1',
                    isHidden: false,
                    sortedChildren: []
                }
            };

            const visibleItems = Tree.getVisibleItems(['root'], hash);

            expect(visibleItems[1].name).to.equal('root_1::root_1_1');

        });
/*
        it('should calculate names for visible items when item has hidden parent', function() {

            hash = {
                root: {
                    id: 'root',
                    name: 'root',
                    parentId: null,
                    isHidden: true,
                    hasHiddenChildren: true,
                    sortedChildren: ['root_1', 'root_2']
                },
                root_1: {
                    id: 'root_1',
                    name: 'root_1',
                    parentId: 'root',
                    isHidden: true,
                    sortedChildren: ['root_1_1']
                },
                root_2: {
                    id: 'root_2',
                    name: 'root_2',
                    parentId: 'root',
                    isHidden: true,
                    sortedChildren: []
                },
                root_1_1: {
                    id: 'root_1_1',
                    name: 'root_1_1',
                    parentId: 'root_1',
                    isHidden: false,
                    sortedChildren: []
                }
            };

            const visibleItems = Tree.getVisibleItems(['root'], hash);

            expect(visibleItems[0].name).to.equal('root::root_1::root_1_1');
        });

        it('should calculate names for visible items when item has hidden parent and siblings', function() {

            hash = {
                root: {
                    id: 'root',
                    name: 'root',
                    parentId: null,
                    isHidden: true,
                    hasHiddenChildren: true,
                    sortedChildren: ['root_1', 'root_2']
                },
                root_1: {
                    id: 'root_1',
                    name: 'root_1',
                    parentId: 'root',
                    isHidden: true,
                    sortedChildren: []
                },
                root_2: {
                    id: 'root_2',
                    name: 'root_2',
                    parentId: 'root',
                    isHidden: false,
                    sortedChildren: ['root_2_1']
                },
                root_2_1: {
                    id: 'root_2_1',
                    name: 'root_2_1',
                    parentId: 'root_2',
                    isHidden: false,
                    sortedChildren: []
                }
            };

            const visibleItems = Tree.getVisibleItems(['root'], hash);

            expect(visibleItems[0].name).to.equal('root::root_2');
        });

        it('should keep name for visible items when item has visible parent', function() {
            hash = {
                root: {
                    id: 'root',
                    name: 'root',
                    parentId: null,
                    isHidden: true,
                    hasHiddenChildren: true,
                    sortedChildren: ['root_1', 'root_2']
                },
                root_1: {
                    id: 'root_1',
                    name: 'root_1',
                    parentId: 'root',
                    isHidden: true,
                    sortedChildren: ['root_1_1']
                },
                root_2: {
                    id: 'root_2',
                    name: 'root_2',
                    parentId: 'root',
                    isHidden: true,
                    sortedChildren: []
                },
                root_1_1: {
                    id: 'root_1_1',
                    name: 'root_1_1',
                    parentId: 'root_1',
                    isHidden: false,
                    sortedChildren: ['root_1_1_1']
                },
                root_1_1_1: {
                    id: 'root_1_1_1',
                    name: 'root_1_1_1',
                    parentId: 'root_1_1',
                    isHidden: false,
                    sortedChildren: []
                }
            };

            const visibleItems = Tree.getVisibleItems(['root'], hash);

            expect(visibleItems[1].name).to.equal('root_1_1_1');
        })
*/
    });

    describe('Test getHiddenItems', function() {

        it('should extract hidden items', function() {

            hash = {
                root: {
                    id: 'root',
                    parentId: null,
                    isHidden: false,
                    hasHiddenChildren: true,
                    children: ['root_1', 'root_2']
                },
                root_1: {
                    id: 'root_1',
                    parentId: 'root',
                    isHidden: true,
                    children: []
                },
                root_2: {
                    id: 'root_2',
                    parentId: 'root',
                    isHidden: false,
                    children: ['root_2_1']
                },
                root_2_1: {
                    id: 'root_2_1',
                    parentId: 'root_2',
                    isHidden: false,
                    children: []
                }
            };


            const hiddenItems = ['root_1'];

            expect(Tree.getHiddenItems(['root'], hash).map(item => item.id)).to.eql(hiddenItems);
        });

        it('should calculate level for hidden items', function() {

            hash = {
                root: {
                    id: 'root',
                    parentId: null,
                    isHidden: true,
                    hasHiddenChildren: true,
                    children: ['root_1', 'root_2']
                },
                root_1: {
                    id: 'root_1',
                    parentId: 'root',
                    isHidden: true,
                    children: []
                },
                root_2: {
                    id: 'root_2',
                    parentId: 'root',
                    isHidden: false,
                    hasHiddenChildren: true,
                    children: ['root_2_1']
                },
                root_2_1: {
                    id: 'root_2_1',
                    parentId: 'root_2',
                    isHidden: true,
                    hasHiddenChildren: false,
                    children: ['root_2_1_1']
                },
                root_2_1_1: {
                    id: 'root_2_1_1',
                    parentId: 'root_2_1',
                    isHidden: false,
                    hasHiddenChildren: false,
                    children: []
                }
            };

            const levels = [1, 1, 2];
            expect(Tree.getHiddenItems(['root'], hash).map(item => item.level)).to.eql(levels);
        });

        it('should ignore case when match items', function() {

            hash = {
                'r': {
                    id: 'r',
                    name: 'r',
                    children: ['root', 'notinfilter'],
                    isHidden: true
                },
                'root': {
                    id: 'root',
                    name: 'ROOT',
                    children: [],
                    isHidden: true
                },
                'notinfilter': {
                    id: 'notinfilter',
                    name: 'notinfilter',
                    children: [],
                    isHidden: true
                }
            };

            let hiddenItems = Tree.getHiddenItems(['r'], hash, {query: ['oo']});
            expect(hiddenItems[0].id).to.equal('root');

        });

        it('should exclude not matched items', function() {
            hash = {
                'root': {
                    id: 'root',
                    name: 'ROOT',
                    children: [],
                    isHidden: true
                },
                'notinfilter': {
                    id: 'notinfilter',
                    name: 'notinfilter',
                    children: [],
                    isHidden: true
                }
            };

            let hiddenItems = Tree.getHiddenItems(['root'], hash, {query: ['oo']});
            expect(hiddenItems.find(item => item.id === 'notinfilter')).to.be.undefined;
        });

        it('should include all children of matched parent', function() {
            hash = {
                'root': {
                    id: 'root',
                    name: 'ROOT',
                    children: ['firstoo', 'second'],
                    isHidden: true
                },
                'firstoo': {
                    id: 'firstoo',
                    name: 'firstoo',
                    children: ['first1'],
                    isHidden: true
                },
                'first1': {
                    id: 'first',
                    name: 'first',
                    children: [],
                    isHidden: true
                },
                'second': {
                    id: 'second',
                    name: 'second',
                    children: [],
                    isHidden: false
                }
            };

            let hiddenItems = Tree.getHiddenItems(['root'], hash, {query: ['oo']});
            expect(hiddenItems.length).to.equal(2);
        });

        it('should include parent of matched child', function() {
            hash = {
                'root': {
                    id: 'root',
                    name: 'ROOT',
                    children: ['first', 'second'],
                    isHidden: true
                },
                'first': {
                    id: 'first',
                    name: 'first',
                    children: ['first1'],
                    isHidden: true
                },
                'first1': {
                    id: 'first1',
                    name: 'first1',
                    children: [],
                    isHidden: true
                },
                'second': {
                    id: 'second',
                    name: 'second',
                    children: [],
                    isHidden: false
                }
            };

            let hiddenItems = Tree.getHiddenItems(['root'], hash, {query: ['1']});
            expect(hiddenItems[0].id).to.equal('first');
        });

        it('should filter complex queries', function() {

            hash = {
                'root': {
                    id: 'root',
                    name: 'root',
                    children: ['first', 'second'],
                    isHidden: true
                },
                'first': {
                    id: 'first',
                    name: 'first',
                    children: ['hibernate', 'form'],
                    isHidden: true
                },
                'form': {
                    id: 'form',
                    name: 'form',
                    children: [],
                    isHidden: true
                },
                'hibernate': {
                    id: 'hibernate',
                    name: 'hibernate',
                    children: [],
                    isHidden: true
                },
                'second': {
                    id: 'second',
                    name: 'second',
                    children: ['hibernate2'],
                    isHidden: true
                },
                'hibernate2': {
                    id: 'hibernate2',
                    name: 'hibernate2',
                    children: [],
                    isHidden: true
                },
                'third': {
                    id: 'third',
                    name: 'third',
                    children: ['all'],
                    isHidden: true
                },
                'sirs': {
                    id: 'sirs',
                    name: 'sirs',
                    children: [],
                    isHidden: true
                }
            };

            let hiddenItems = Tree.getHiddenItems(['root'], hash, {query: ['irs', 'nate']});
            expect(hiddenItems.map(item => item.id)).to.eql(['first', 'hibernate']);
        });

        it('should filter by all queries simultaneously', function() {

            hash = {
                'root': {
                    id: 'root',
                    name: 'root',
                    children: ['1', '2']
                },
                '1': {
                    id: '1',
                    name: '1',
                    children: [],
                    isHidden: true
                },
                '2': {
                    id: '2',
                    name: '2',
                    children: [],
                    isHidden: true
                }
            };

            let hiddenItems = Tree.getHiddenItems(['root'], hash, {query: ['1', '2']});
            expect(hiddenItems.length).to.equal(0);
        });

    });

    describe('Test move', function() {

        it('should return null when item have no visible parent', function() {
            hash['root'].isHidden = true;

            hash = Tree.move('root_1', 'up', hash);

            expect(hash).to.be.null;
        });

        it('should throw exception if visible parent does not contain item', function() {
            hash['root'].isHidden = false;

            function move() {
                hash = Tree.move('root_1', 'up', hash);
            }

            expect(move).to.throw('data structure is broken');
        });

        it('should return null when item is first and direction is up', function() {
            hash['root'].isHidden = false;
            hash['root'].sortedChildren = [{id: 'root_1'}, {id: 'root_2'}];

            hash = Tree.move('root_1', 'up', hash);

            expect(hash).to.be.null;
        });

        it('should return null when item is last and direction is down', function() {
            hash['root'].isHidden = false;
            hash['root'].sortedChildren = [{id: 'root_2'}, {id: 'root_1'}];

            hash = Tree.move('root_1', 'down', hash);

            expect(hash).to.be.null;
        });

        it('should change items in array when direction is up', function() {

            hash['root'].isHidden = false;
            hash['root'].sortedChildren = [{id: 'root_1_2'}, {id: 'root_1_1'}, {id: 'root_1_3'}];
            hash['root_1'].isHidden = true;

            hash = Tree.move('root_1_1', 'up', hash);

            expect(hash['root'].sortedChildren.map(item => item.id)).to.eql(['root_1_1', 'root_1_2', 'root_1_3']);

        })

        it('should change items in array when direction is down', function() {

            hash['root'].isHidden = false;
            hash['root'].sortedChildren = [{id: 'root_1_2'}, {id: 'root_1_1'}, {id: 'root_1_3'}];
            hash['root_1'].isHidden = true;

            hash = Tree.move('root_1_1', 'down', hash);

            expect(hash['root'].sortedChildren.map(item => item.id)).to.eql(['root_1_2', 'root_1_3', 'root_1_1']);

        })

    })

});
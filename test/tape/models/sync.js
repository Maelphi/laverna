/**
 * Test models/Sync
 * @file
 */
import test from 'tape';
import sinon from 'sinon';
import {Model as BModel} from 'backbone';
import Sync from '../../../app/scripts/models/Sync';
import Db from '../../../app/scripts/models/Db';

class Model extends BModel {
    constructor() {
        super();
        this.profileId = 'test';
        this.storeName = 'test-storeName';
    }
}

let sand;
test('Sync: before()', t => {
    sand = sinon.sandbox.create();
    t.end();
});

test('Sync: db()', t => {
    const sync = new Sync();
    t.equal(sync.db instanceof Db, true, 'creates an instance of models/Db');
    t.end();
});

test('Sync: use()', t => {
    t.equal(typeof Sync.use(), 'function', 'returns a function');
    t.end();
});

test('Sync: sync()', t => {
    const sync  = new Sync();
    const stub  = sand.stub(sync, 'read');
    const model = new Model({id: '1', title: 'Test'});

    sync.sync('read', model, {test: 1});
    const called = stub.calledWithMatch(model, {
        idAttribute : 'id',
        test        : 1,
        profile     : model.profileId,
        storeName   : model.storeName,
    });
    t.equal(called, true, 'proxies methods');

    sand.restore();
    t.end();
});

test('Sync: sync() - collection', t => {
    const sync  = new Sync();
    const stub  = sand.stub(sync, 'read');

    sync.sync('read', {profileId: 'test', storeName: 'sync'});
    const called = stub.calledWithMatch({}, {
        profile   : 'test',
        storeName : 'sync',
    });
    t.equal(called, true, 'can handle collections');

    sand.restore();
    t.end();
});

test('Sync: read()', t => {
    const sync  = new Sync();

    sand.stub(sync, 'findItem');
    sync.read({idAttribute: 'id'}, {test: 1});
    t.equal(sync.findItem.calledWith({idAttribute: 'id'}, {test: 1}), true,
        'will try to find a model by Id');

    sand.stub(sync, 'find');
    sync.read({model: '1'}, {test: 1});
    t.equal(sync.find.calledWith({model: '1'}, {test: 1}), true,
        'will find all models if the first argument is a collection');

    sand.restore();
    t.end();
});

test('Sync: findItem()', t => {
    const sync  = new Sync();
    const model = new Model({id: '1', title: 'Test'});
    sand.spy(model, 'set');

    const res = sync.findItem(model, {id: '1'});
    t.equal(typeof res.then, 'function', 'returns a promise');

    res.then(() => {
        t.equal(model.set.calledWith({}), true, 'changes model attributes');
        sand.restore();
        t.end();
    });
});

test('Sync: find()', t => {
    const sync = new Sync();
    const coll = {model: Model};

    const res = sync.find(coll, {profile: 'test', storeName: 'sync-find'});
    t.equal(typeof res.then, 'function', 'returns a promise');

    res.then(res => {
        t.equal(res, coll, 'returns collection');
        t.end();
    });
});

test('Sync: create() + update()', t => {
    const sync = new Sync();
    const stub = sand.stub(sync, 'save');

    sync.create('1', '2');
    t.equal(stub.calledWith('1', '2'), true, 'executes save method');

    sync.update('1', '2');
    t.equal(stub.calledWith('1', '2'), true, 'executes save method');

    sand.restore();
    t.end();
});

test('Sync: save()', t => {
    const sync  = new Sync();
    const model = new Model({id: '1'});
    const opt   = {profile: 'test', storeName: 'sync-save'};

    model.set('title', 'Test');
    sand.spy(model, 'set');

    t.comment(`sync model: ${model.attributes.title}`);
    const res = sync.save(model, opt);
    t.equal(typeof res.then, 'function', 'returns a promise');

    res.then(() => {
        t.equal(model.set.calledWithMatch({title: 'Test'}), true,
            'sets new attributes');
        sand.restore();
        t.end();
    });
});

test('Sync: find()', t => {
    const sync = new Sync();
    const opt  = {profile: 'test', storeName: 'sync-save'};
    const coll = {model: Model};
    coll.add   = sand.stub();

    sync.find(coll, opt)
    .then(() => {
        t.equal(coll.add.called, true, 'adds found models to the collection');
        sand.restore();
        t.end();
    });
});
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  emptyProductForm, formFromProduct, imageFileProblem, marginPercent, moveImage, productRequest, stockTone, validateProductForm,
  type AdminProduct,
} from '../src/ui/productCatalog.ts';

const tea: AdminProduct = { id: 7, sku: 'TEA-1', name: 'Assam tea', description: 'Strong', price: 4.5, costPrice: 2, reorderThreshold: 5,
  imageUrl: '/api/products/images/aaaaaaaa-0000-4000-8000-000000000001', active: true, category: { id: 3, name: 'Tea' } };
const photo = { id: 'aaaaaaaa-0000-4000-8000-000000000001', url: '/api/products/images/aaaaaaaa-0000-4000-8000-000000000001' };

describe('product form', () => {
  it('loads a product and saves it back without touching stock', () => {
    const form = formFromProduct(tea, [photo], 12);
    assert.equal(form.categoryId, '3');
    assert.equal(form.imageUrl, '');
    const body = productRequest(form, { stock: true, loadedStock: '12' });
    assert.deepEqual(body.imageIds, [photo.id]);
    assert.equal(body.imageUrl, null);
    assert.equal(body.stockOnHand, undefined);
    assert.equal(body.price, 4.5);
    assert.equal(body.categoryId, 3);
  });

  it('sends stock only when it changed and the person may change it', () => {
    const form = { ...formFromProduct(tea, [], 12), stockOnHand: '20' };
    assert.equal(productRequest(form, { stock: true, loadedStock: '12' }).stockOnHand, 20);
    assert.equal(productRequest(form, { stock: false, loadedStock: '12' }).stockOnHand, undefined);
    const fresh = { ...emptyProductForm(), name: 'Mug', price: '9', stockOnHand: '5' };
    assert.equal(productRequest(fresh, { stock: true }).stockOnHand, 5);
  });

  it('keeps an old external image link only when there is no uploaded photo', () => {
    const external = formFromProduct({ ...tea, imageUrl: 'https://cdn.example.com/tea.jpg' }, []);
    assert.equal(external.imageUrl, 'https://cdn.example.com/tea.jpg');
    assert.equal(productRequest(external, { stock: false }).imageUrl, 'https://cdn.example.com/tea.jpg');
    assert.equal(productRequest({ ...external, images: [photo] }, { stock: false }).imageUrl, null);
  });

  it('explains what is wrong', () => {
    const errors = validateProductForm({ ...emptyProductForm(), sku: 'bad sku', price: '-1', costPrice: 'x', reorderThreshold: '1.5',
      stockOnHand: '-3', imageUrl: 'javascript:alert(1)' }, { stock: true });
    assert.deepEqual(Object.keys(errors).sort(), ['costPrice', 'imageUrl', 'name', 'price', 'reorderThreshold', 'sku', 'stockOnHand']);
    assert.deepEqual(validateProductForm({ ...emptyProductForm(), name: 'Mug', price: '9.99' }, { stock: true }), {});
  });
});

describe('images, margin and stock', () => {
  it('checks files before uploading', () => {
    assert.equal(imageFileProblem({ type: 'image/png', size: 1000 }), null);
    assert.match(imageFileProblem({ type: 'image/svg+xml', size: 10, name: 'logo.svg' }) ?? '', /not a PNG/);
    assert.match(imageFileProblem({ type: 'image/jpeg', size: 6 * 1024 * 1024 }) ?? '', /larger than 5 MB/);
  });

  it('reorders photos so any one can become the main image', () => {
    const a = { id: 'a', url: 'a' }, b = { id: 'b', url: 'b' }, c = { id: 'c', url: 'c' };
    assert.deepEqual(moveImage([a, b, c], 2, 0).map((i) => i.id), ['c', 'a', 'b']);
    assert.deepEqual(moveImage([a, b, c], 0, 1).map((i) => i.id), ['b', 'a', 'c']);
    assert.deepEqual(moveImage([a, b], 0, 5).map((i) => i.id), ['a', 'b']);
  });

  it('works out margin and stock state', () => {
    assert.equal(marginPercent('10', '6'), 40);
    assert.equal(marginPercent('10', ''), null);
    assert.equal(stockTone(0, 5), 'out');
    assert.equal(stockTone(5, 5), 'low');
    assert.equal(stockTone(6, 5), 'ok');
    assert.equal(stockTone(undefined, 5), 'unknown');
  });
});

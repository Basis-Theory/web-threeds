import { encode } from '@/utils/encoding';

describe('encode', () => {
  it('should encode an object to a base64 string without padding characters', () => {
    const inputObject = { name: 'John', age: 25, city: 'New York' };
    const expectedResult =
      'eyJuYW1lIjoiSm9obiIsImFnZSI6MjUsImNpdHkiOiJOZXcgWW9yayJ9';

    const result = encode(inputObject);

    expect(result).toBe(expectedResult);
  });

  it('should handle special characters in the object values', () => {
    const inputObject = { name: 'Alice & Bob', age: 30, city: 'San Francisco' };
    const expectedResult =
      'eyJuYW1lIjoiQWxpY2UgJiBCb2IiLCJhZ2UiOjMwLCJjaXR5IjoiU2FuIEZyYW5jaXNjbyJ9';

    const result = encode(inputObject);

    expect(result).toBe(expectedResult);
  });

  it('should handle empty object', () => {
    const inputObject = {};
    const expectedResult = 'e30';

    const result = encode(inputObject);

    expect(result).toBe(expectedResult);
  });

  it('should replace "+" with "-" in the base64-encoded string', () => {
    const inputObject = { data: 'example+data', value: 42 };
    const expectedResult = 'eyJkYXRhIjoiZXhhbXBsZStkYXRhIiwidmFsdWUiOjQyfQ';

    const result = encode(inputObject);

    expect(result).toBe(expectedResult);
  });

  it('should replace "/" with "_" in the base64-encoded string', () => {
    const inputObject = { path: 'folder/subfolder', count: 3 };
    const expectedResult = 'eyJwYXRoIjoiZm9sZGVyL3N1YmZvbGRlciIsImNvdW50IjozfQ';

    const result = encode(inputObject);

    expect(result).toBe(expectedResult);
  });

  it('should remove "=" padding characters from the base64-encoded string', () => {
    const inputObject = { key: 'value', number: 123 };
    const expectedResult = 'eyJrZXkiOiJ2YWx1ZSIsIm51bWJlciI6MTIzfQ';

    const result = encode(inputObject);

    expect(result).toBe(expectedResult);
  });
});

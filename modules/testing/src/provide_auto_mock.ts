export type Mock<T> = T &
  { [P in keyof T]: T[P] extends Function ? T[P] & jasmine.Spy : never };

export function automaticallyCreateMock<T>(type: Function): Mock<T> {
  const target: any = {};

  function installProtoMethods(proto: any) {
    if (proto === null || proto === Object.prototype) {
      return;
    }

    for (let key of Object.getOwnPropertyNames(proto)) {
      const descriptor = Object.getOwnPropertyDescriptor(proto, key)!;

      if (typeof descriptor.value === 'function' && key !== 'constructor') {
        target[key] = jasmine.createSpy(key);
      }
    }

    installProtoMethods(Object.getPrototypeOf(proto));
  }

  installProtoMethods(type.prototype);

  return target;
}

export function provideAutoMock<T>(
  type: Function
): [Function, { produce: () => any }] {
  return [
    type,
    {
      produce: () => automaticallyCreateMock(type),
    },
  ];
}

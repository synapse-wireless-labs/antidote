import 'core-js/es7/reflect';
import {
  createInjector,
  Service,
  Injector,
  createToken,
  Provider,
  Inject,
  provide,
} from './di';

describe('Injector', () => {
  it('should resolve classes with no dependencies', async () => {
    class Root {}

    const root = await createInjector().get(Root);

    expect(root instanceof Root).toBe(true);
  });

  it('should resolve classes with type-annotated dependencies', async () => {
    class Dependency {}
    @Service()
    class Root {
      constructor(public dependency: Dependency) {}
    }

    const root = await createInjector().get(Root);

    expect(root instanceof Root).toBe(true);
    expect(root.dependency instanceof Dependency).toBe(true);
  });

  it('should be able to inject itself', async () => {
    const injector = createInjector();
    const ownInjector = await injector.get(Injector);

    expect(ownInjector).toBe(injector);
  });

  it('should throw an error when trying to resolve a circular dependency', async () => {
    @Service()
    class Dependency {
      constructor(private dependency: Dependency) {}
    }
    @Service()
    class Root {
      constructor(private dependency: Dependency) {}
    }

    try {
      const root = await createInjector().get(Root);

      fail('Resolved circular dependency succesfully???');
    } catch (e) {
      expect(e.message).toContain(
        'Cyclical dependency detected when trying to resolve Dependency'
      );
    }
  });

  it('should let you resolve classes with static dependencies', async () => {
    class Dependency {}
    class Root {
      static params = [Dependency];
      constructor(public dependency: Dependency) {}
    }

    const root = await createInjector().get(Root);

    expect(root instanceof Root).toBe(true);
    expect(root.dependency instanceof Dependency).toBe(true);
  });

  it('should let you resolve classes with a static provider', async () => {
    class Dependency {}
    class Root {
      static provider: Provider<Root> = {
        deps: [Dependency],
        produce: (dependency: Dependency) => new Root(dependency),
      };
      constructor(public dependency: Dependency) {}
    }

    const root = await createInjector().get(Root);

    expect(root instanceof Root).toBe(true);
    expect(root.dependency instanceof Dependency).toBe(true);
  });

  it('should let you override a constructor parameter with the @Inject() decorator', async () => {
    class Dependency {}
    class Root {
      constructor(@Inject(Dependency) public dependency: any) {}
    }

    const root = await createInjector().get(Root);

    expect(root instanceof Root).toBe(true);
    expect(root.dependency instanceof Dependency).toBe(true);
  });

  it('should let you preseed the injector with resolved providers', async () => {
    const actual: string = 'Hello';
    class Root {}

    const isNotRoot = await createInjector([
      provide(Root, { produce: () => actual }),
    ]).get(Root);

    expect(isNotRoot).toBe(actual);
  });

  describe('Tokens', () => {
    it('should let you inject a token', async () => {
      const config = { name: 'App' };
      const configToken = createToken('Config', {
        produce: () => config,
      });

      const result = await createInjector().get(configToken);

      expect(result).toBe(config);
    });

    it('should let you inject dependencies into a token', async () => {
      @Service()
      class Dependency {}
      const dependencyToken = createToken('Dependency', {
        deps: [Dependency],
        produce: (dependency: Dependency) => dependency,
      });

      const result = await createInjector().get(dependencyToken);

      expect(result instanceof Dependency).toBe(true);
    });
  });
});

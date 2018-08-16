declare var Reflect: any;

export interface Type<T> {
  new (...args: any[]): T;
}

export interface StaticType<T> extends Type<T> {
  params: Injectable<any>[];
}

export interface StaticProvider<T> extends Type<T> {
  provider: Provider<T>;
}

export class Token<T> {
  constructor(public name: string, public provider: Provider<T>) {}
}

export type Injectable<T> =
  | Type<T>
  | Token<T>
  | StaticType<T>
  | StaticProvider<T>
  | Function;

export interface Provider<T> {
  deps?: Injectable<any>[];
  produce(...args: any[]): T | Promise<T>;
}

export type ParamMap = {
  [index: number]: Injectable<any>;
};

const isToken = (maybeToken: any): maybeToken is Token<any> =>
  maybeToken instanceof Token;
const isReflectiveType = (
  maybeReflectiveType: any
): maybeReflectiveType is Type<any> =>
  hasMetadata('design:paramtypes', maybeReflectiveType);
const isStaticType = (
  maybeStaticType: any
): maybeStaticType is StaticType<any> =>
  maybeStaticType.params && Array.isArray(maybeStaticType.params);
const isStaticProvider = (
  maybeStaticProvider: any
): maybeStaticProvider is StaticProvider<any> =>
  maybeStaticProvider.provider && maybeStaticProvider.provider.produce;

export function hasMetadata(key: string, target: any) {
  return Reflect && Reflect.hasMetadata && Reflect.hasMetadata(key, target);
}

export function getMetadata(key: string, target: any) {
  return Reflect && Reflect.getMetadata && Reflect.getMetadata(key, target);
}

export function Service<T>(provider?: Provider<T>) {
  return function(type: Type<T>) {
    if (provider) {
      Reflect.defineMetadata('antidote:factory', provider, type);
    }
  };
}

export function getParamMap(proto: object): ParamMap {
  if (!Reflect.hasMetadata('antidote:params', proto)) {
    Reflect.defineMetadata('antidote:params', {}, proto);
  }

  return Reflect.getMetadata('antidote:params', proto)!;
}

export function Inject(symbol: Injectable<any>): ParameterDecorator {
  return function(target, key, index) {
    const paramMap = getParamMap(target);

    paramMap[index] = symbol;

    console.log(target, paramMap);
  };
}

export function getProvider<T>(
  injectable: Injectable<T>
): Provider<T> | undefined {
  if (isToken(injectable)) {
    return injectable.provider;
  } else if (hasMetadata('antidote:factory', injectable)) {
    const provider: Provider<T> = getMetadata('antidote:factory', injectable);

    return provider;
  } else if (isReflectiveType(injectable)) {
    const potentialDeps: any[] = getMetadata('design:paramtypes', injectable);
    const paramMap = getParamMap(injectable);
    const deps = potentialDeps.map(
      (dep: any, index: number) => paramMap[index] || dep
    );

    return {
      deps,
      produce: (...args: any[]) => Promise.resolve(new injectable(...args)),
    };
  } else if (isStaticType(injectable)) {
    return {
      deps: injectable.params,
      produce: (...args: any[]) => Promise.resolve(new injectable(...args)),
    };
  } else if (isStaticProvider(injectable)) {
    return injectable.provider;
  } else if (injectable instanceof Function && injectable.length === 0) {
    return {
      deps: [],
      produce: () => Promise.resolve(new (injectable as any)()),
    };
  }

  return undefined;
}

export class Injector {
  private _i: Map<Provider<any>, Promise<any>>;
  private _p: Map<Injectable<any>, Provider<any>>;

  constructor(providers: [Injectable<any>, Provider<any>][] = []) {
    this._i = new Map<Provider<any>, Promise<any>>();
    this._p = new Map<Injectable<any>, Provider<any>>([
      [
        Injector,
        {
          deps: [],
          produce: () => this,
        },
      ],
      ...providers,
    ]);
  }

  private _gP<T>(injectable: Injectable<T>): Provider<T> {
    if (!this._p.has(injectable)) {
      const provider = getProvider(injectable);

      if (provider === undefined) {
        throw new Error(`No provider exists for type ${injectable.name}`);
      }

      this._p.set(injectable, provider);
    }

    return this._p.get(injectable)!;
  }

  private _gI<T>(
    injectable: Injectable<T>,
    provider: Provider<T>,
    chain: Injectable<any>[] = []
  ): Promise<T> {
    if (chain.some(previousInjectable => previousInjectable === injectable)) {
      throw new Error(
        `Cyclical dependency detected when trying to resolve ${injectable.name}`
      );
    }

    if (!this._i.has(provider)) {
      this._i.set(
        provider,
        (provider.deps
          ? Promise.all(
              provider.deps.map(injectableDep =>
                this._gI(injectableDep, this._gP(injectableDep), [
                  ...chain,
                  injectable,
                ])
              )
            )
          : Promise.resolve([])
        ).then(args => provider.produce(...args))
      );
    }

    return this._i.get(provider)!;
  }

  get<T>(injectable: Injectable<T>): Promise<T> {
    return this._gI(injectable, this._gP(injectable));
  }
}

export function createToken<T>(tokenName: string, provider: Provider<T>) {
  return new Token(tokenName, provider);
}

export function createInjector(providers?: [Injectable<any>, Provider<any>][]) {
  return new Injector(providers);
}

export function provide<T>(
  injectable: Injectable<T>,
  provider: Provider<T>
): [Injectable<T>, Provider<T>] {
  return [injectable, provider];
}

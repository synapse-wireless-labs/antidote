import 'core-js/es7/reflect';
import { provideAutoMock, Mock } from './provide_auto_mock';

describe('provideAutoMock', () => {
  it('should automatically create a mock of a service', async () => {
    class Service {
      prop = 123;
      method() {}
    }

    const [_, provider] = provideAutoMock(Service);
    const service: Mock<Service> = provider.produce() as any;

    expect(service.method.and).toBeDefined();
    expect(service.prop).toBeUndefined();
  });
});

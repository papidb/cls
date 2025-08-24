import { Container } from "inversify";
import { DatabaseConnection } from "./app.bind";
import { db } from "./db";
import { LinkService } from "./service/link.service";

const container = new Container({
  autobind: true,
});

container.bind(DatabaseConnection).toConstantValue(db);
container.bind(LinkService).toSelf();

export const getFromContainer: typeof Container.prototype.get = (
  serviceIdentifier,
  options
) => {
  return container.get(serviceIdentifier, options);
};

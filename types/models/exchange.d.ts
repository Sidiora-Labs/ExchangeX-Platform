


interface exchangeAttributes {
  id: string;
  name: string;
  title: string;
  status?: boolean;
  username?: string;
  version?: string;
  productId?: string;
  type?: string;
}

type exchangePk = "id";
type exchangeId = exchange[exchangePk];
type exchangeOptionalAttributes =
  | "id"
  | "status"
  | "username"
  | "version"
  | "productId"
  | "type";
type exchangeCreationAttributes = Optional<
  exchangeAttributes,
  exchangeOptionalAttributes
>;

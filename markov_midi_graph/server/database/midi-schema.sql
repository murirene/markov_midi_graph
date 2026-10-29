CREATE TABLE node (
  node_id integer PRIMARY KEY,
  value text,
  x double precision,
  y double precision
);

CREATE SEQUENCE node_id_seq AS integer;
ALTER SEQUENCE node_id_seq OWNED BY node.node_id;

CREATE TABLE edge (
  edge_id integer PRIMARY KEY,
  from_node_id integer REFERENCES node (node_id),
  to_node_id integer REFERENCES node (node_id), 
  weight double precision,
  UNIQUE (from_node_id, to_node_id)
);

CREATE SEQUENCE edge_id_seq AS integer;
ALTER SEQUENCE edge_id_seq OWNED BY edge.edge_id;


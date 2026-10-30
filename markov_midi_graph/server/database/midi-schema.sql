
CREATE SEQUENCE node_id_seq AS integer;
CREATE TABLE node (
  node_id integer PRIMARY KEY DEFAULT nextval('node_id_seq'),
  value text,
  x double precision NOT NULL,
  y double precision NOT NULL
);

ALTER SEQUENCE node_id_seq OWNED BY node.node_id;

CREATE SEQUENCE edge_id_seq AS integer;
CREATE TABLE edge (
  edge_id integer PRIMARY KEY DEFAULT nextval('edge_id_seq'),
  from_node_id integer REFERENCES node (node_id) NOT NULL,
  to_node_id integer REFERENCES node (node_id) NOT NULL, 
  weight double precision NOT NULL,
  UNIQUE (from_node_id, to_node_id)
);

ALTER SEQUENCE edge_id_seq OWNED BY edge.edge_id;


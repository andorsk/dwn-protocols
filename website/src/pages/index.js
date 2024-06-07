import React, { useEffect, useState } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import styles from "./index.module.css";
import protocolTree from "@site/static/data/protocol-directory-tree.json";
import CodeBlock from "@theme/CodeBlock";

function getRootFromProtocolTree(tree) {
  const root = tree.filter((item) => item.name === "protocols");
  if (root.length === 0) throw new Error("Could not find protocols root");
  if (root.length > 1) throw new Error("Found multiple protocols roots");
  return root[0];
}

function buildNamespaces(root) {
  return root.contents.filter((child) => child.type === "directory");
}

function getProtocols(namespaces, selected) {
  const namespace = namespaces.find((n) => n.name === selected);
  console.log("getting namespace", selected);
  if (!namespace) throw new Error(`Could not find namespace ${selected.name}`);
  return namespace.contents.filter((item) => item.type === "directory");
}

function getVersions(protocol) {
  if (!protocol) throw new Error(`Could not find protocol ${selected}`);
  return protocol.contents.filter((item) => item.type === "directory");
}

function buildPath({ namespace, protocol, version }) {
  return `/protocols/${namespace}/${protocol}/${version}`;
}

async function fetchMetadata({ namespace, protocol, version }) {
  const url = buildPath({ namespace, protocol, version }) + "/metadata.json";
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch metadata");
    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

async function fetchProtocol({ namespace, protocol, version }) {
  const url = buildPath({ namespace, protocol, version }) + "/protocol.json";
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch protocol");
    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

function MetadataDisplay({ namespace, protocol, version }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchMetadata({ namespace, protocol, version })
      .then((metadata) => setData(metadata))
      .catch((error) => console.error("Error fetching metadata:", error));
  }, [namespace, protocol, version]); // Dependency array ensures effect runs only when these values change

  return (
    <div className="w-full h-full">
      {data ? (
        <CodeBlock language="json" title="Metadata" showLineNumbers={true}>
          {JSON.stringify(data, null, 2)}
        </CodeBlock>
      ) : (
        <p>Loading metadata...</p>
      )}
    </div>
  );
}

function ProtocolDisplay({ namespace, protocol, version }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchProtocol({ namespace, protocol, version })
      .then((protocolData) => setData(protocolData))
      .catch((error) => console.error("Error fetching protocol:", error));
  }, [namespace, protocol, version]); // Dependency array

  return (
    <div className="w-full h-full">
      {data ? (
        <CodeBlock
          language="json"
          title="Protocol Definition"
          showLineNumbers={true}
        >
          {JSON.stringify(data, null, 2)}
        </CodeBlock>
      ) : (
        <p>Loading protocol...</p>
      )}
    </div>
  );
}

function SearchBar({
  selection,
  onSelectionChange,
  namespaces,
  protocols,
  versions,
}) {
  return (
    <div className="searchBar container text-left">
      <div className="row">
        <label htmlFor="namespaceSelect" className="col">
          Namespace
        </label>
        <select
          className="form-select col"
          id="namespaceSelect"
          value={selection.namespace}
          onChange={(e) =>
            onSelectionChange({ ...selection, namespace: e.target.value })
          }
        >
          {namespaces.map((ns) => (
            <option key={ns.name} value={ns.name}>
              {ns.name}
            </option>
          ))}
        </select>
      </div>
      <div className="row">
        <label htmlFor="protocolSelect" className="col">
          Protocol
        </label>
        <select
          className="form-select col"
          id="protocolSelect"
          value={selection.protocol}
          onChange={(e) =>
            onSelectionChange({ ...selection, protocol: e.target.value })
          }
        >
          {protocols.map((protocol) => (
            <option key={protocol.name} value={protocol.name}>
              {protocol.name}
            </option>
          ))}
        </select>
      </div>
      <div className="row">
        <label htmlFor="versionSelect" className="col">
          Version
        </label>
        <select
          className="form-select col"
          id="versionSelect"
          value={selection.version}
          onChange={(e) =>
            onSelectionChange({ ...selection, version: e.target.value })
          }
        >
          {versions.map((version) => (
            <option key={version.name} value={version.name}>
              {version.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

const getProtocol = (protocols, selected) => {
  const protocol = protocols.find((p) => p.name === selected);
  console.log("getting protocol", selected);
  if (!protocol) throw new Error(`Could not find protocol ${selected}`);
  return protocol;
};

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  const [selection, setSelection] = useState({
    namespace: "",
    protocol: "",
    version: "",
  });
  const [namespaces, setNamespaces] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    try {
      const root = getRootFromProtocolTree(protocolTree);
      const ns = buildNamespaces(root);
      if (ns.length === 0) throw new Error("No namespaces found");
      setNamespaces(ns);
      setSelection({ ...selection, namespace: ns[0].name });

      const protocols = getProtocols(ns, selection.namespace);
      setProtocols(protocols);
      setSelection({ ...selection, protocol: protocols[0].name });

      const protocol = getProtocol(protocols, selection.protocol);
      const versions = getVersions(protocol);
      setVersions(versions);
      setSelection({ ...selection, version: versions[0].name });
      console.log("selection is ", selection);
    } catch (error) {
      console.error("Error setting namespaces:", error);
    }
  }, [selection.namespace, selection.protocol, selection.version]);

  return (
    <Layout title={`${siteConfig.title}`} description="Explore Protocols">
      <main className="flex flex-col items-center justify-center h-full">
        <SearchBar
          selection={selection}
          onSelectionChange={setSelection}
          namespaces={namespaces}
          protocols={protocols}
          versions={versions}
        />
        {selection.namespace && selection.protocol && selection.version && (
          <div className="flex w-full">
            <MetadataDisplay className="w-1/2 mr-4" {...selection} />
            <ProtocolDisplay className="w-1/2 ml-4" {...selection} />
          </div>
        )}
      </main>
    </Layout>
  );
}

import React from "react";
import VersionCard from "./VersionCard.jsx";

const VersionList = React.memo(({
  versions,
  fileName,
  onDownload,
  onDelete,
  onRestore,
  downloading,
  deleting,
  restoring,
}) => {
  if (versions.length === 0) {
    return <p className="empty-version-message">No versions available.</p>;
  }

  return (
    <div className="version-list">
      {versions.map((v) => (
        <VersionCard
          key={v.fileId}
          version={v}
          fileName={fileName}
          onDownload={onDownload}
          onDelete={onDelete}
          onRestore={onRestore}
          downloading={downloading}
          deleting={deleting}
          restoring={restoring}
        />
      ))}
    </div>
  );
});

export default VersionList;

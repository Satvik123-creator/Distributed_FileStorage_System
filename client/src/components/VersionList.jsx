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
    return <p className="text-center text-muted text-sm py-6">No versions available.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
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

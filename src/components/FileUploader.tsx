import { useEffect } from "react";
import Uppy from "@uppy/core";
import { DragDrop } from "@uppy/react";
import XHRUpload from "@uppy/xhr-upload";

import "@uppy/core/dist/style.css";
import "@uppy/drag-drop/dist/style.css";

export function MyUploader() {
    const uppy = new Uppy({restrictions: {maxNumberOfFiles: 5}})
        .use(XHRUpload, {endpoint: "/api/upload", fieldName: "file"});

    useEffect(() => {
        return () => uppy.clear();
    }, []);

    return <DragDrop uppy={uppy} note="Kéo thả file vào đây"/>;
}

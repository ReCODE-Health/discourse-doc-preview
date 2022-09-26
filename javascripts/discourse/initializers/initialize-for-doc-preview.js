import {withPluginApi} from "discourse/lib/plugin-api";
import {iconHTML} from "discourse-common/lib/icon-library";
import Mobile from "discourse/lib/mobile";

const PREVIEW_HEIGHT = 500;

export default {
  name: "doc-previews",
  initialize() {
    withPluginApi("0.8.41", (api) => {
      if (Mobile.mobileView) return;

      try {
        const previewModeSetting = settings.preview_mode;
        const newTabIcon = () => {
          const template = document.createElement("template");
          template.innerHTML = iconHTML("external-link-alt", {
            class: "new-tab-doc-icon",
          });
          return template.content.firstChild;
        };

        const createPreviewElement = () => {
          const iframe = document.createElement("iframe");
          iframe.src = "";
          iframe.height = PREVIEW_HEIGHT;
          iframe.loading = "lazy";
          iframe.classList.add("doc-preview");
          return iframe;
        };

        const setUpPreviewType = (doc, renderMode) => {
          if (renderMode === "Inline") {
            let preview = createPreviewElement();
            doc.classList.add("doc-attachment");
            doc.after(preview);

            return preview;
          }

          if (renderMode === "New Tab") {
            doc.classList.add("new-tab-doc");
            doc.prepend(newTabIcon());
          }
        };
        api.decorateCookedElement(
          (post) => {
            const attachments = [...post.querySelectorAll(".attachment")];
            const docs = attachments.filter((attachment) =>
              attachment.href.match(/\.[(pdf|doc|docx)]+$/)
            );
            docs.forEach((doc) => {
              const fileSize = doc.nextSibling;
              if (fileSize) {
                fileSize.nodeValue = "";
              }

              const startsWithWhitespace = /^\s+/;
              const fileName = doc.innerText;

              // open the doc in a new tab if either the global setting is
              // "New Tab" or if the doc description starts with a whitespace
              // otherwise, render the preview in the inline in the post
              const renderMode =
                previewModeSetting === "New Tab" ||
                startsWithWhitespace.test(fileName)
                  ? "New Tab"
                  : "Inline";

              // we don't need the space anymore.
              doc.innerText = doc.innerText.trim();

              let preview = setUpPreviewType(doc, renderMode);

              if (renderMode === "Inline") {
                const href = doc.href
                const currURL = window.location.host
                href = href.includes(currURL)? href: currURL+href;
                preview.src = 'https://docs.google.com/gview?url=' +  href + '&embedded=true';
              }

              if (renderMode === "New Tab") {
                doc.addEventListener("click", (event) => {
                  event.preventDefault();
                  window.open(doc.href);

                });
              }
            });
          },
          {
            id: "doc-previews",
            onlyStream: true,
          }
        );
      } catch (error) {
        console.error("There's an issue in the doc previews theme component");
        console.error(error);
      }
    });
  },
};

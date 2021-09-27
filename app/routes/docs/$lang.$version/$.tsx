import {
  HeadersFunction,
  LoaderFunction,
  redirect,
  RouteComponent,
} from "remix";

import { json } from "remix";

import { getDoc, getVersion, getVersions } from "~/utils.server";
import { DocsPage } from "~/components/doc";
import { time } from "~/utils/time";

let loader: LoaderFunction = async ({ context, params, request }) => {
  let path = await import("path");
  try {
    let versions = await getVersions();

    let version = getVersion(params.version, versions) || {
      version: params.version,
      head: params.version,
      isLatest: false,
    };

    let lang = params.lang;
    let slug = params["*"];
    let ext = path.extname(slug);

    if (ext) {
      // remove the extension
      let noExtension = request.url.slice(0, -ext.length);
      return redirect(noExtension);
    }

    let [ms, doc] = await time(() => getDoc(context.docs, slug, version, lang));

    // we could also throw an error in getDoc if the doc doesn't exist
    if (!doc) {
      return json({ notFound: true }, { status: 404 });
    }

    return json(doc, {
      headers: {
        "Cache-Control": "max-age=60",
        "Server-Timing": `db;dur=${ms}`,
      },
    });
  } catch (error) {
    console.error(error);
    return json({ notFound: true }, { status: 404 });
  }
};

const headers: HeadersFunction = ({ loaderHeaders }) => {
  return {
    "Server-Timing": loaderHeaders.get("Server-Timing") ?? "",
  };
};

const SplatPage: RouteComponent = () => {
  return <DocsPage />;
};

export default SplatPage;
export { headers, loader };
export { meta } from "~/components/doc";

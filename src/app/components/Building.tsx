import React, { useState, useEffect } from 'react';
import { StateContext } from '../StateProvider';
import _ from 'lodash';
import { getBuilding } from '../services/api';
import DOMPurify from 'dompurify';

export default function Building(props) {
  const context = React.useContext(StateContext);
  const [buildingHtml, setBuildingHtml] = useState(null);

  const getBuildingHtml = async (slug) => {
    const payload = {
      ...context.config,
      slug: slug,
    };
    const res = await getBuilding(payload);
    const html = res?.data?.html;

    if ( html ) {
      setBuildingHtml(html);

    } else {
      props.clearBuilding();
    }
  }
 
  useEffect(() => {
    // Clear out existing state.
    setBuildingHtml(null);

    if ( props.building ) {
      // Request new state.
      getBuildingHtml(props.building);
    }
  }, [props.building]);

  return (<div className="vpfo-lsb-single-container">
    { buildingHtml === null &&
      <div className="vpfo-lsb-loading-scrim"><div className="vpfo-lsb-loading-indicator"></div></div>
    }
    {
      buildingHtml &&
      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(buildingHtml, { ADD_TAGS: ["iframe"], ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'] }) }} />
    }
  </div>);
}

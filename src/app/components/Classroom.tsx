import React, { useState, useEffect } from 'react';
import { StateContext } from '../StateProvider';
import _ from 'lodash';
import { getClassroom } from '../services/api';
import instantiateSlider from '../services/slider';
import instantiateAccordions from '../services/accordion';
import instantiateLightbox from '../services/lightbox';
import DOMPurify from 'dompurify';

export default function Classroom(props) {
  const context = React.useContext(StateContext);
  const [classroomHtml, setClassroomHtml] = useState(null);

  // Listen to when html content changes, and instantiate the slider when this occurs.
  useEffect(() => {
    if ( classroomHtml ) {
      instantiateSlider();
      instantiateAccordions();
      instantiateLightbox();
    }
  }, [classroomHtml])

  const getClassroomHtml = async (slug) => {
    const payload = {
      ...context.config,
      slug: slug,
    };
    // console.log(payload);
    const res = await getClassroom(payload);
    const html = res?.data?.html;

    if ( html ) {
      setClassroomHtml(html);
    } else {
      props.clearClassroom();
    }
  }
 
  useEffect(() => {
    // Clear out existing state.
    setClassroomHtml(null);

    if ( props.classroom ) {
      // Request new state.
      getClassroomHtml(props.classroom);
    }
  }, [props.classroom]);

  return (<div className="vpfo-lsb-single-container">
    { classroomHtml === null &&
      <div className="vpfo-lsb-loading-scrim"><div className="vpfo-lsb-loading-indicator"></div></div>
    }
    {
      classroomHtml &&
      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(classroomHtml, { ADD_TAGS: ["iframe"], ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'] }) }} />
    }
  </div>);
}
import React, { useState, useEffect } from 'react';
import Select from 'react-select'


export default function SelectInput({options}) {

  console.log('Select options', options);

  return (
    <Select options={options}>
      
    </Select>
  );
}
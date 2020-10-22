declare
idx number(6);
BEGIN
idx := 1;
htp.p('[');
FOR data IN ( SELECT
  bar.person_id as PERSON_ID,
  p.FACILITY_DISP as FACILITY_DISP,
  p.UNIT_DISP as UNIT_DISP,
  P.ROOM_DISP as ROOM_DISP,
  p.NAME_FULL_FORMATTED as NAME_FULL_FORMATTED
FROM
  rta_bmdi_acquired_result_cache_derived bar
  JOIN rta_bmdi_device_parameter_cache_derived bdp ON bdp.device_parameter_id = bar.device_parameter_id
  JOIN rta_bmdi_monitored_device_cache_derived bmd ON bar.monitored_device_id = bmd.monitored_device_id
  JOIN rta_code_values_cache_derived cv ON cv.code_value = bmd.location_cd
  join rta_location_group_cache_derived lg1 ON bmd.location_cd = lg1.child_loc_cd
  JOIN rta_code_values_cache_derived cv2 ON lg1.parent_loc_cd = cv2.code_value
  JOIN rta_location_group_cache_derived lg2 ON lg1.parent_loc_cd = lg2.child_loc_cd
  JOIN rta_code_values_cache_derived cv3 ON lg2.parent_loc_cd = cv3.code_value
  join rta_inhouse_cache_derived p on p.person_id = bar.person_id
WHERE
  bar.updt_dt_tm BETWEEN (SYSDATE -(1)) AND SYSDATE
  AND (
    bdp.parameter_alias IN ( 'SPO2-%', 'SpO2', 'SPO2_SPO2' )
  )
ORDER BY
  bar.person_id,
  bar.acquired_dt_tm  )
LOOP
if idx =1 then
    idx := 2;
else
    htp.p(',');
end if;
    htp.p('{"person_id":"'||data.PERSON_ID||'", "facility_disp":"'||data.FACILITY_DISP||'", "unit_disp":"'||data.UNIT_DISP||'", "room_disp":"'||data.ROOM_DISP||'", "name_full_formatted":"'||data.NAME_FULL_FORMATTED||'"}');

END LOOP;
htp.p(']');

END;
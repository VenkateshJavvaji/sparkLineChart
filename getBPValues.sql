declare
idx number(6);
BEGIN
idx := 1;
htp.p('[');
FOR data IN ( SELECT
  bar.person_id as PERSON_ID,
  bdp.parameter_alias as parameter_alias,
  (to_number(bar.result_val)) as PARAMETER,
  to_char(bar.acquired_dt_tm, 'YYYY-MM-DD HH24:MI:SS') as ACQUIRED_TIME
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
    bdp.parameter_alias IN ( 'NBP Mean', 'ABP_MEAN', 'NBP-M', 'NIBP_MEAN', 'ABPm', 'NBPm', 'AR3-M', 'AR1-M', 'AR2-M', 'ART_MEAN', 'ARTm', 'AR4-M' )
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
    htp.p('{"person_id":"'||data.PERSON_ID||'", "parameter_alias":"'||data.parameter_alias||'", "parameter":"'||data.PARAMETER||'", "acquired_time":"'||data.ACQUIRED_TIME||'"}');

END LOOP;
htp.p(']');

END;
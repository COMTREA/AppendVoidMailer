select doc.entityid, note.EPISODE_NUMBER, note.date_of_service, note.service_charge_code, note.service_program_value as "program_value", note.location_value, note.service_duration, note.service_start_time, note.service_end_time, note.practitioner_id, note.practitioner_name, note.note_type_value, note.data_entry_date, note.data_entry_time, doc.new_comments_appended
from docr.append_documents doc
join cwssystem.cw_patient_notes note on note.FACILITY = doc.FACILITY and note.PATID = doc.ENTITYID and note.NOT_uniqueid = doc.JOIN_TO_UNIQUE_ID
where doc.id > {count}
SELECT top({count}) void.PATID, void.EPISODE_NUMBER, void.date_of_group_service, hist.SERVICE_CODE, hist.program_value, hist.start_time, hist.end_time, void.data_entry_by, void.data_entry_time, void.void_comments
FROM cwssystem.cw_notes_voided void
left join system.billing_tx_history hist on hist.FACILITY = void.FACILITY and hist.patid = void.patid and hist.JOIN_TO_TX_HISTORY = void.JOIN_TO_TX_HISTORY
order by void.void_data_entry_date desc, convert(datetime(), void.void_data_entry_time) desc
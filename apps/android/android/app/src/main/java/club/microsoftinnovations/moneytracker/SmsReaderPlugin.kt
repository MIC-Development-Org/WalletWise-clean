package club.microsoftinnovations.moneytracker

import android.Manifest
import android.net.Uri
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

/**
 * Reads bank SMS from the inbox on the device.
 * Messages are filtered here by sender id, so OTPs and personal chats never reach JavaScript.
 * Parsing happens in the shared TypeScript engine, and only extracted fields leave the phone.
 */
@CapacitorPlugin(
    name = "SmsReader",
    permissions = [Permission(strings = [Manifest.permission.READ_SMS], alias = "sms")]
)
class SmsReaderPlugin : Plugin() {

    @PluginMethod
    fun readHistory(call: PluginCall) {
        if (getPermissionState("sms").toString() != "granted") {
            requestPermissionForAlias("sms", call, "onSmsPermission")
            return
        }
        read(call)
    }

    @PermissionCallback
    private fun onSmsPermission(call: PluginCall) {
        if (getPermissionState("sms").toString() == "granted") read(call)
        else call.reject("SMS permission denied")
    }

    private fun read(call: PluginCall) {
        val senderPattern = call.getString("senderPattern") ?: return call.reject("senderPattern required")
        val sinceMs = call.getLong("sinceMs", 0L) ?: 0L
        val limit = (call.getInt("limit", 2000) ?: 2000).coerceIn(1, 5000)
        val sender = try {
            Regex(senderPattern)
        } catch (e: Exception) {
            return call.reject("invalid senderPattern")
        }

        val out = JSArray()
        val cursor = context.contentResolver.query(
            Uri.parse("content://sms/inbox"),
            arrayOf("address", "body", "date"),
            "date >= ?",
            arrayOf(sinceMs.toString()),
            "date DESC"
        )
        cursor?.use {
            val addr = it.getColumnIndexOrThrow("address")
            val body = it.getColumnIndexOrThrow("body")
            val date = it.getColumnIndexOrThrow("date")
            while (it.moveToNext() && out.length() < limit) {
                val from = it.getString(addr) ?: continue
                if (!sender.containsMatchIn(from)) continue
                out.put(JSObject().apply {
                    put("sender", from)
                    put("body", it.getString(body) ?: "")
                    put("date", it.getLong(date))
                })
            }
        }
        call.resolve(JSObject().put("messages", out))
    }
}

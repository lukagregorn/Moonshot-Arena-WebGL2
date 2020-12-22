const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const quat = glMatrix.quat;

export default class Utils {

    static init(object, defaults, options) {
        let filtered = Utils.clone(options || {});
        let defaulted = Utils.clone(defaults || {});
        for (let key in filtered) {
            if (!defaulted.hasOwnProperty(key)) {
                delete filtered[key];
            }
        }
        Object.assign(object, defaulted, filtered);
    }

    static clone(object) {
        return JSON.parse(JSON.stringify(object));
    }

    static ToEulerAngles(quaterion) {
        let q = {'x':quaterion[0], 'y':quaterion[1], 'z':quaterion[2], 'w':quaterion[3]};  // x, y, z, w
        let angles = [0,0,0];

        const pi = Math.PI;
        const halfpi = pi / 2;
    
        // roll (x-axis rotation)
        let sinr_cosp = 2 * (q.w * q.x + q.y * q.z);
        let cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y);
        angles[0] = Math.atan2(sinr_cosp, cosr_cosp);
    
        // pitch (y-axis rotation)
        let sinp = 2 * (q.w * q.y - q.z * q.x);
        if (Math.abs(sinp) >= 1)
            angles[1] = halfpi * Math.sign(sinp); // use 90 degrees if out of range
        else
            angles[1] = Math.asin(sinp);
    
        // yaw (z-axis rotation)
        let siny_cosp = 2 * (q.w * q.z + q.x * q.y);
        let cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
        angles[2] = Math.atan2(siny_cosp, cosy_cosp);
    
        //console.log(angles);
        return angles;
    }

}
